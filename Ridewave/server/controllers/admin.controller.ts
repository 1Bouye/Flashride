import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

const sanitizeDriver = (driver: any) => {
  if (!driver) return driver;
  const { password, ...rest } = driver;
  return rest;
};

const ADMIN_EMAIL =
  process.env.FLASHRIDE_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD =
  process.env.FLASHRIDE_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return res.status(500).json({
      success: false,
      message: "Admin credentials are not configured.",
    });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid administrator credentials.",
    });
  }

  const token = jwt.sign({ role: "admin" }, ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });

  return res.status(200).json({
    success: true,
    token,
  });
};

export const getDriversForReview = async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };

  const drivers = await prisma.driver.findMany({
    where:
      status && status !== "all"
        ? {
            accountStatus: status,
          }
        : undefined,
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({
    success: true,
    drivers: drivers.map((driver) => ({
      ...sanitizeDriver(driver),
      submittedAt: driver.createdAt,
    })),
  });
};

export const updateDriverReviewStatus = async (req: Request, res: Response) => {
  const { decision, rejectionReason } = req.body as {
    decision: "approved" | "declined" | "blocked" | "reinstate";
    rejectionReason?: string;
  };
  const { driverId } = req.params;

  if (!["approved", "declined", "blocked", "reinstate"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message:
        "Decision must be one of 'approved', 'declined', 'blocked', or 'reinstate'.",
    });
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found.",
    });
  }

  if (decision === "declined" && !rejectionReason) {
    return res.status(400).json({
      success: false,
      message: "Please include a rejection reason.",
    });
  }

  const dataToUpdate: any = {
    reviewedAt: new Date(),
  };

  if (decision === "approved") {
    dataToUpdate.accountStatus = "approved";
    dataToUpdate.rejectionReason = null;
    dataToUpdate.status = "inactive";
  }

  if (decision === "declined") {
    dataToUpdate.accountStatus = "declined";
    dataToUpdate.rejectionReason = rejectionReason ?? null;
    dataToUpdate.status = "inactive";
  }

  if (decision === "blocked") {
    dataToUpdate.accountStatus = "blocked";
    dataToUpdate.rejectionReason = null;
    dataToUpdate.status = "inactive";
  }

  if (decision === "reinstate") {
    dataToUpdate.accountStatus = "approved";
    dataToUpdate.rejectionReason = null;
  }

  const updatedDriver = await prisma.driver.update({
    where: { id: driverId },
    data: dataToUpdate,
  });

  return res.status(200).json({
    success: true,
    driver: sanitizeDriver(updatedDriver),
  });
};

