require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import twilio from "twilio";
import prisma from "../utils/prisma";
import jwt from "jsonwebtoken";
import { nylas } from "../app";
import { sendToken } from "../utils/send-token";
import { OAuth2Client } from "google-auth-library";

type TwilioConfig = {
  client: ReturnType<typeof twilio>;
  serviceSid: string;
};

const getTwilioClient = (): TwilioConfig | null => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const serviceSid = process.env.TWILIO_SERVICE_SID ?? "";

  const missing: string[] = [];
  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
  if (!serviceSid) missing.push("TWILIO_SERVICE_SID");

  if (missing.length) {
    console.warn(
      `[Twilio] OTP disabled. Missing environment variables: ${missing.join(
        ", "
      )}`
    );
    return null;
  }

  const client = twilio(accountSid, authToken, { lazyLoading: true });
  console.log(`[Twilio] Client initialized with service SID: ${serviceSid}`);
  return { client, serviceSid };
};

const getGoogleClient = (): OAuth2Client | null => {
  const webClientId = process.env.GOOGLE_WEB_CLIENT_ID ?? "";
  if (!webClientId) {
    console.warn(
      "[GoogleAuth] GOOGLE_WEB_CLIENT_ID missing. Google login is disabled."
    );
    return null;
  }
  return new OAuth2Client(webClientId);
};

// Development mode: Skip OTP verification (set SKIP_OTP_VERIFICATION=true in .env)
const isDevMode = () => {
  return process.env.SKIP_OTP_VERIFICATION === "true" || 
         process.env.NODE_ENV === "development" && process.env.SKIP_OTP_VERIFICATION !== "false";
};

const DEV_OTP_CODE = "1234"; // Test OTP code that always works in dev mode

// register new user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone_number } = req.body as { phone_number: string };
  try {

    if (!phone_number || !/^\+222\d{8}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid Mauritania number (+222XXXXXXXX).",
      });
    }

    // Development mode: Skip Twilio OTP
    if (isDevMode()) {
      console.log(`[DEV MODE] OTP verification skipped for ${phone_number}. Use code: ${DEV_OTP_CODE}`);
      return res.status(201).json({
        success: true,
        message: `OTP sent successfully. (DEV MODE: Use code ${DEV_OTP_CODE})`,
      });
    }

    const twilioConfig = getTwilioClient();
    if (!twilioConfig) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
      const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
      const serviceSid = process.env.TWILIO_SERVICE_SID ?? "";
      const missing: string[] = [];
      if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
      if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
      if (!serviceSid) missing.push("TWILIO_SERVICE_SID");
      
      console.error(`[Twilio] Missing environment variables: ${missing.join(", ")}`);
      return res.status(503).json({
        success: false,
        message: `OTP service is temporarily unavailable. Missing: ${missing.join(", ")}`,
      });
    }

    const verification = await twilioConfig.client.verify.v2
      .services(twilioConfig.serviceSid)
      .verifications.create({
      channel: "sms",
      to: phone_number,
    });

    console.log(`[Twilio] OTP sent to ${phone_number}, status: ${verification.status}`);

    res.status(201).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error: any) {
    console.error("[Twilio] Failed to send OTP", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      phone_number: phone_number,
    });
    res.status(400).json({
      success: false,
      message: error?.message || "Unable to send verification code.",
    });
  }
};

// verify otp
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone_number, otp } = req.body as {
    phone_number: string;
    otp: string;
  };
  try {

    if (!phone_number || !/^\+222\d{8}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid Mauritania number.",
      });
    }

    if (!otp || !/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code.",
      });
    }

    // Development mode: Accept test OTP code
    if (isDevMode()) {
      if (otp === DEV_OTP_CODE) {
        console.log(`[DEV MODE] OTP verified for ${phone_number} using test code`);
        // Continue with user creation/login logic below
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid OTP code. (DEV MODE: Use code ${DEV_OTP_CODE})`,
        });
      }
    } else {
      // Production mode: Use Twilio verification
      const twilioConfig = getTwilioClient();
      if (!twilioConfig) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
        const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
        const serviceSid = process.env.TWILIO_SERVICE_SID ?? "";
        const missing: string[] = [];
        if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
        if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
        if (!serviceSid) missing.push("TWILIO_SERVICE_SID");
        
        console.error(`[Twilio] Missing environment variables: ${missing.join(", ")}`);
        return res.status(503).json({
          success: false,
          message: `OTP service is temporarily unavailable. Missing: ${missing.join(", ")}`,
        });
      }

      const verification = await twilioConfig.client.verify.v2
        .services(twilioConfig.serviceSid)
        .verificationChecks.create({
          to: phone_number,
          code: otp,
        });

      console.log(`[Twilio] OTP verification for ${phone_number}, status: ${verification.status}`);

      if (verification.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: `Invalid or expired OTP code. Status: ${verification.status}`,
        });
      }
    }

    // is user exist
    const isUserExist = await prisma.user.findFirst({
      where: {
        phone_number,
      },
    });
    if (isUserExist) {
      if ((isUserExist as any).authProvider !== "otp") {
        return res.status(400).json({
          success: false,
          message: "Phone number is registered with a different provider.",
        });
      }
      await sendToken(isUserExist, res);
    } else {
      // create account
      const user = await prisma.user.create({
        data: {
          authProvider: "otp",
          phone_number,
        } as any,
      });
      await sendToken(user, res);
    }
  } catch (error: any) {
    console.error("[Twilio] OTP verification failed", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      phone_number: phone_number,
    });
    res.status(400).json({
      success: false,
      message: error?.message || "Unable to verify code. Please request a new OTP.",
    });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body as { idToken: string };

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Missing Google ID token.",
      });
    }

    const googleClient = getGoogleClient();
    if (!googleClient) {
      return res.status(503).json({
        success: false,
        message: "Google authentication is temporarily unavailable.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token.",
      });
    }

    const googleId = payload.sub;
    const email = payload.email ?? null;
    const name = payload.name ?? null;
    const picture = payload.picture ?? null;

    let user = await prisma.user.findUnique({
      where: {
        googleId,
      } as any,
    });

    if (!user) {
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({
          where: {
            email,
          },
        });
        if (existingEmailUser) {
          user = await prisma.user.update({
            where: { id: existingEmailUser.id },
            data: {
              googleId,
              authProvider: "google",
              name: existingEmailUser.name ?? name,
              avatar: (existingEmailUser as any).avatar ?? picture,
            } as any,
          });
        }
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name,
          avatar: picture,
          authProvider: "google",
        } as any,
      });
    }

    if ((user as any).authProvider !== "google") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "google",
        } as any,
      });
    }

    await sendToken(user, res);
  } catch (error: any) {
    console.error("[GoogleAuth] Verification failed", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    res.status(401).json({
      success: false,
      message: error?.message || "Unable to authenticate with Google.",
    });
  }
};

// Supabase OAuth login endpoint
export const supabaseLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, supabaseUserId } = req.body as {
      email: string;
      name: string | null;
      avatar: string | null;
      supabaseUserId: string;
    };

    if (!email || !supabaseUserId) {
      return res.status(400).json({
        success: false,
        message: "Missing required user information.",
      });
    }

    // Check if user exists by email or supabaseUserId (stored in googleId field)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId: supabaseUserId } as any, // Reuse googleId field for Supabase user ID
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          avatar: avatar || null,
          googleId: supabaseUserId, // Store Supabase user ID in googleId field
          authProvider: "google",
        } as any,
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email || email,
          name: user.name || name || null,
          avatar: (user as any).avatar || avatar || null,
          googleId: supabaseUserId, // Update with Supabase user ID
          authProvider: "google",
        } as any,
      });
    }

    await sendToken(user, res);
  } catch (error: any) {
    console.error("[SupabaseAuth] Error:", {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(401).json({
      success: false,
      message: error?.message || "Unable to authenticate with Google.",
    });
  }
};

// sending otp to email
export const sendingOtpToEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, userId } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const user = {
      userId,
      name,
      email,
    };
    const token = jwt.sign(
      {
        user,
        otp,
      },
      process.env.EMAIL_ACTIVATION_SECRET!,
      {
        expiresIn: "5m",
      }
    );

    // Development mode: Skip email sending
    if (isDevMode()) {
      console.log(`[DEV MODE] Email OTP skipped for ${email}. Use code: ${otp}`);
      return res.status(201).json({
        success: true,
        token,
        devMode: true,
        otp: otp, // Return OTP in dev mode so user can see it
      });
    }

    try {
      await nylas.messages.send({
        identifier: process.env.USER_GRANT_ID!,
        requestBody: {
          to: [{ name: name, email: email }],
          subject: "Verify your email address!",
          body: `
          <p>Hi ${name},</p>
      <p>Your Flashride verification code is ${otp}. If you didn't request this OTP, please ignore this email.</p>
      <p>Thanks,<br>Flashride Team</p>
          `,
        },
      });
      res.status(201).json({
        success: true,
        token,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
};

// verifying email otp
export const verifyingEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { otp, token } = req.body;

    const newUser: any = jwt.verify(
      token,
      process.env.EMAIL_ACTIVATION_SECRET!
    );

    // Development mode: Accept any 4-digit OTP
    if (isDevMode()) {
      if (!otp || !/^\d{4}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message: `Invalid OTP code. (DEV MODE: Use any 4-digit code or ${newUser.otp})`,
        });
      }
      console.log(`[DEV MODE] Email OTP verified using code: ${otp}`);
    } else {
      // Production mode: Verify OTP matches
      if (newUser.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: "OTP is not correct or expired!",
        });
      }
    }

    const { name, email, userId } = newUser.user;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update user with email and name if they don't have them
    let updatedUser = user;
    if (user.email === null || !user.name) {
      updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: user.name || name,
          email: user.email || email,
        },
      });
    }

    // Always send token after email verification
    await sendToken(updatedUser, res);
  } catch (error: any) {
    console.error("[Email Verification] Error:", {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(400).json({
      success: false,
      message: error?.message || "OTP verification failed. Please try again.",
    });
  }
};

// complete profile (update name only, skip email verification)
export const completeProfile = async (req: Request, res: Response) => {
  try {
    const { name, userId } = req.body as { name: string; userId: string };

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update user with name
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: name.trim(),
      },
    });

    console.log(`[CompleteProfile] User ${userId} profile completed with name: ${name}`);

    // Return access token
    await sendToken(updatedUser, res);
  } catch (error: any) {
    console.error("[CompleteProfile] Error:", {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to complete profile. Please try again.",
    });
  }
};

// get logged in user data
export const getLoggedInUserData = async (req: any, res: Response) => {
  try {
    const user = req.user;

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

// getting user rides
export const getAllRides = async (req: any, res: Response) => {
  const rides = await prisma.rides.findMany({
    where: {
      userId: req.user?.id,
    },
    include: {
      driver: true,
      user: true,
    },
  });
  res.status(201).json({
    rides,
  });
};
