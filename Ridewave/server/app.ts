const path = require("path");
const envPath = path.resolve(__dirname, ".env");
console.log(`[dotenv] Loading .env from: ${envPath}`);
const result = require("dotenv").config({ path: envPath });
if (result.error) {
  console.error(`[dotenv] Error loading .env:`, result.error);
} else {
  console.log(`[dotenv] Loaded ${Object.keys(result.parsed || {}).length} variables from .env`);
}
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.route";
import Nylas from "nylas";
import driverRouter from "./routes/driver.route";
import adminRouter from "./routes/admin.route";

// Check Twilio configuration on startup
const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
const serviceSid = process.env.TWILIO_SERVICE_SID ?? "";

// Debug: Check for common typos
const allEnvKeys = Object.keys(process.env);
const twilioKeys = allEnvKeys.filter(key => key.includes("TWILIO"));
if (twilioKeys.length > 0) {
  console.log(`[Twilio Debug] Found ${twilioKeys.length} Twilio-related env vars:`, twilioKeys);
}

// Check for common typos
if (!accountSid) {
  if (process.env.TWILIO_ACCOOUNT_SID) {
    console.error(`[Twilio] ❌ TYPO FOUND: You have "TWILIO_ACCOOUNT_SID" (double O) but need "TWILIO_ACCOUNT_SID"`);
  }
  if (process.env["TWILIO_ACCOUNT_SID "]) {
    console.error(`[Twilio] ❌ TYPO FOUND: Variable has trailing space: "TWILIO_ACCOUNT_SID "`);
  }
}
if (!authToken) {
  if (process.env["TWILIO_AUTH-TOKEN"]) {
    console.error(`[Twilio] ❌ TYPO FOUND: You have "TWILIO_AUTH-TOKEN" (hyphen) but need "TWILIO_AUTH_TOKEN" (underscore)`);
  }
  if (process.env["TWILIO_AUTH_TOKEN "]) {
    console.error(`[Twilio] ❌ TYPO FOUND: Variable has trailing space: "TWILIO_AUTH_TOKEN "`);
  }
}
if (!serviceSid) {
  if (process.env["TWILIO_SERVICE_SID "]) {
    console.error(`[Twilio] ❌ TYPO FOUND: Variable has trailing space: "TWILIO_SERVICE_SID "`);
  }
}

const missing: string[] = [];
if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
if (!serviceSid) missing.push("TWILIO_SERVICE_SID");

if (missing.length) {
  console.warn(`[Twilio] ⚠️  OTP service disabled. Missing environment variables: ${missing.join(", ")}`);
  console.warn(`[Twilio] Add these to your .env file in Ridewave/server/.env`);
  console.warn(`[Twilio] Make sure there are NO spaces around the = sign and NO quotes around values`);
  console.warn(`[Twilio] Format: TWILIO_ACCOUNT_SID=your_value_here`);
} else {
  console.log(`[Twilio] ✅ OTP service configured (Service SID: ${serviceSid.substring(0, 10)}...)`);
}

// Check for development mode
const skipOtp = process.env.SKIP_OTP_VERIFICATION === "true";
if (skipOtp) {
  console.log(`[DEV MODE] 🧪 OTP verification is DISABLED. Test OTP code: 1234`);
  console.log(`[DEV MODE] To enable real OTP, set SKIP_OTP_VERIFICATION=false in .env`);
}

export const app = express();

export const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY!,
  apiUri: "https://api.eu.nylas.com",
});

// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parserv
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:8081",
      "http://localhost:8083",
      "http://localhost:8084",
    ],
    credentials: true,
  })
);

// routes
app.use("/api/v1", userRouter);
app.use("/api/v1/driver", driverRouter);
app.use("/api/v1/admin", adminRouter);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    succcess: true,
    message: "API is working",
  });
});

// debug endpoint to check Twilio env vars (remove in production)
app.get("/debug/twilio", (req: Request, res: Response) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_SERVICE_SID;
  
  res.status(200).json({
    TWILIO_ACCOUNT_SID: accountSid ? `${accountSid.substring(0, 4)}...` : "NOT SET",
    TWILIO_AUTH_TOKEN: authToken ? `${authToken.substring(0, 4)}...` : "NOT SET",
    TWILIO_SERVICE_SID: serviceSid ? `${serviceSid.substring(0, 4)}...` : "NOT SET",
    allSet: !!(accountSid && authToken && serviceSid),
  });
});
