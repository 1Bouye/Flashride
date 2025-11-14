// Add this to: Ridewave/server/controllers/user.controller.ts

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
    // Option 1: Reuse googleId field for Supabase user ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId: supabaseUserId } as any, // Reuse googleId field
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
          authProvider: "google", // or "supabase" if you prefer
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
          authProvider: "google", // or "supabase"
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

// Add to: Ridewave/server/routes/user.route.ts
// import { supabaseLogin } from "../controllers/user.controller";
// userRouter.post("/supabase-login", supabaseLogin);

