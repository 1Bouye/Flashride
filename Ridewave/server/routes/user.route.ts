import express from "express";
import {
  getAllRides,
  getLoggedInUserData,
  registerUser,
  sendingOtpToEmail,
  verifyingEmail,
  verifyOtp,
  googleLogin,
  supabaseLogin,
  completeProfile,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/isAuthenticated";

const userRouter = express.Router();

userRouter.post("/registration", registerUser);

userRouter.post("/verify-otp", verifyOtp);

userRouter.post("/email-otp-request", sendingOtpToEmail);

userRouter.put("/email-otp-verify", verifyingEmail);

userRouter.post("/google-login", googleLogin);

userRouter.post("/supabase-login", supabaseLogin);

userRouter.post("/complete-profile", completeProfile);

userRouter.get("/me", isAuthenticated, getLoggedInUserData);

userRouter.get("/get-rides", isAuthenticated, getAllRides);

export default userRouter;
