import express from "express";
import {
  adminLogin,
  getDriversForReview,
  updateDriverReviewStatus,
} from "../controllers/admin.controller";
import { isAuthenticatedAdmin } from "../middleware/isAuthenticated";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.get("/drivers", isAuthenticatedAdmin, getDriversForReview);
adminRouter.patch(
  "/drivers/:driverId",
  isAuthenticatedAdmin,
  updateDriverReviewStatus
);

export default adminRouter;

