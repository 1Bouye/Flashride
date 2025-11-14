require("dotenv").config();
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { sendToken } from "../utils/send-token";

const normalizeVehicleType = (vehicleType: string) => {
  const value = vehicleType?.toLowerCase();
  if (value === "car") return "Car";
  if (value === "motorcycle") return "Motorcycle";
  return "CNG";
};

const sanitizeDriver = (driver: any) => {
  if (!driver) return driver;
  const { password, ...rest } = driver;
  return rest;
};

export const registerDriver = async (req: Request, res: Response) => {
  try {
    const {
      name,
      country,
      phone_number,
      email,
      password,
      vehicle_type,
      registration_number,
      registration_date,
      driving_license,
      vehicle_color,
      rate,
    } = req.body;

    if (
      !name ||
      !country ||
      !phone_number ||
      !email ||
      !password ||
      !vehicle_type ||
      !registration_number ||
      !registration_date ||
      !driving_license ||
      !rate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const normalizedPhoneNumber = String(phone_number).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingDriver = await prisma.driver.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone_number: normalizedPhoneNumber },
          { registration_number },
        ],
      },
    });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message:
          "An account with the provided email, phone number, or registration number already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.driver.create({
      data: {
        name,
        country,
        phone_number: normalizedPhoneNumber,
        email: normalizedEmail,
        password: hashedPassword,
        vehicle_type: normalizeVehicleType(vehicle_type),
        registration_number,
        registration_date,
        driving_license,
        vehicle_color,
        rate,
        accountStatus: "pending",
        status: "inactive",
      },
    });

    return res.status(201).json({
      success: true,
      message:
        "Application submitted successfully. An administrator will review your details soon.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit application. Please try again later.",
    });
  }
};

export const loginDriver = async (req: Request, res: Response) => {
  try {
    const { phone_number, password } = req.body as {
      phone_number: string;
      password: string;
    };

    if (!phone_number || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required.",
      });
    }

    const normalizedPhoneNumber = phone_number.trim();

    const driver = await prisma.driver.findUnique({
      where: {
        phone_number: normalizedPhoneNumber,
      },
    });

    if (!driver) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (driver.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          driver.accountStatus === "declined"
            ? driver.rejectionReason ??
              "Your application was declined. Please contact support."
            : driver.accountStatus === "blocked"
            ? "Your account is currently blocked. Please contact support."
            : "Your application is still under review.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, driver.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const sanitizedDriver = sanitizeDriver(driver);
    sendToken(sanitizedDriver, res);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Unable to sign in. Please try again later.",
    });
  }
};

export const getLoggedInDriverData = async (req: any, res: Response) => {
  try {
    const driver = sanitizeDriver(req.driver);

    res.status(200).json({
      success: true,
      driver,
    });
  } catch (error) {
    console.log(error);
  }
};

// updating driver status
export const updateDriverStatus = async (req: any, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status value is required.",
      });
    }

    console.log(
      `[DriverStatus] ${req.driver?.id ?? "unknown"} requested status -> ${status}`
    );

    const driver = await prisma.driver.update({
      where: {
        id: req.driver.id!,
      },
      data: {
        status,
      },
    });

    console.log(
      `[DriverStatus] ${driver.id} status updated to ${driver.status}`
    );

    res.status(201).json({
      success: true,
      driver: sanitizeDriver(driver),
    });
  } catch (error: any) {
    console.log("[DriverStatus] Failed to update status", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get drivers data with id
export const getDriversById = async (req: Request, res: Response) => {
  try {
    const { ids } = req.query as any;
    if (!ids) {
      return res.status(400).json({ message: "No driver IDs provided" });
    }

    const driverIds = ids.split(",");

    // Fetch drivers from database
    const drivers = await prisma.driver.findMany({
      where: {
        id: { in: driverIds },
      },
    });

    res.json(drivers.map(sanitizeDriver));
  } catch (error) {
    console.error("Error fetching driver data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// creating new ride
export const newRide = async (req: any, res: Response) => {
  try {
    const {
      userId,
      charge,
      status,
      currentLocationName,
      destinationLocationName,
      distance,
    } = req.body;

    const newRide = await prisma.rides.create({
      data: {
        userId,
        driverId: req.driver.id,
        charge: parseFloat(charge),
        status,
        currentLocationName,
        destinationLocationName,
        distance,
      },
    });
    res.status(201).json({ success: true, newRide });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// updating ride status
export const updatingRideStatus = async (req: any, res: Response) => {
  try {
    const { rideId, rideStatus } = req.body;

    // Validate input
    if (!rideId || !rideStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid input data" });
    }

    const driverId = req.driver?.id;
    if (!driverId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch the ride data to get the rideCharge
    const ride = await prisma.rides.findUnique({
      where: {
        id: rideId,
      },
    });

    if (!ride) {
      return res
        .status(404)
        .json({ success: false, message: "Ride not found" });
    }

    const rideCharge = ride.charge;

    // Update ride status
    const updatedRide = await prisma.rides.update({
      where: {
        id: rideId,
        driverId,
      },
      data: {
        status: rideStatus,
      },
    });

    if (rideStatus === "Completed") {
      // Update driver stats if the ride is completed
      await prisma.driver.update({
        where: {
          id: driverId,
        },
        data: {
          totalEarning: {
            increment: rideCharge,
          },
          totalRides: {
            increment: 1,
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      updatedRide,
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// getting drivers rides
export const getAllRides = async (req: any, res: Response) => {
  const rides = await prisma.rides.findMany({
    where: {
      driverId: req.driver?.id,
    },
    include: {
      driver: true,
      user: true,
    },
  });
  res.status(201).json({
    rides: rides.map((ride) => ({
      ...ride,
      driver: sanitizeDriver(ride.driver),
    })),
  });
};
