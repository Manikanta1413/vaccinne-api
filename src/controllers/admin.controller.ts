// controllers/admin.controller.ts
import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import Slot, { ISlot } from "../models/slot.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req: Request, res: Response) : Promise<any> => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res
      .status(400)
      .json({ message: "Phone number and password required" });
  }

  try {
    const admin = await User.findOne({ phoneNumber, role: "admin" });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        name: admin.name,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error });
  }
};

export const getUsersWithFilters = async (req: Request, res: Response) => {
  try {
    const { age, pincode, vaccinationStatus } = req.query;

    const query: any = { role: "user" };

    if (age) query.age = age;
    if (pincode) query.pincode = pincode;

    if (vaccinationStatus) {
      if (vaccinationStatus === "none") {
        query["vaccinationStatus.firstDose.vaccinated"] = false;
      } else if (vaccinationStatus === "firstDose") {
        query["vaccinationStatus.firstDose.vaccinated"] = true;
        query["vaccinationStatus.secondDose.vaccinated"] = false;
      } else if (vaccinationStatus === "all") {
        query["vaccinationStatus.secondDose.vaccinated"] = true;
      }
    }

    const users = await User.find(query).select("-password");

    res.status(200).json({ users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};


export const getSlotSummaryByDate = async (req: Request, res: Response): Promise<any> => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  try {
    const parsedDate = new Date(date as string);
    const isoDate = parsedDate.toISOString().split("T")[0]; // yyyy-mm-dd

    const users = await User.find({
      $or: [
        { "vaccinationStatus.firstDose.slotId": { $ne: null } },
        { "vaccinationStatus.secondDose.slotId": { $ne: null } },
      ],
    }).populate([
      { path: "vaccinationStatus.firstDose.slotId", model: "Slot" },
      { path: "vaccinationStatus.secondDose.slotId", model: "Slot" },
    ]);

    let firstDoseCount = 0;
    let secondDoseCount = 0;

    users.forEach((user) => {
      const firstSlot = user.vaccinationStatus.firstDose.slotId as any;
      const secondSlot = user.vaccinationStatus.secondDose.slotId as any;

      if (firstSlot && firstSlot.date === isoDate) {
        firstDoseCount++;
      }

      if (secondSlot && secondSlot.date === isoDate) {
        secondDoseCount++;
      }
    });

    const total = firstDoseCount + secondDoseCount;

    return res.status(200).json({
      date: isoDate,
      firstDoseCount,
      secondDoseCount,
      total,
    });
  } catch (error) {
    console.error("Error fetching slot summary:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllSlotDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const slots = await Slot.find({
      date: { $gte: "2024-11-01", $lte: "2024-11-30" },
    }).sort({ date: 1, startTime: 1 });

    const formattedSlots = slots.map((slot) => ({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedCount: slot.bookedUsers.length,
      remainingCapacity: 10 - slot.bookedUsers.length,
    }));

    return res.status(200).json({ slots: formattedSlots });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSlotDetailsByDate = async (req: Request, res: Response): Promise<any> => {
  const { date } = req.params;  // Date format: YYYY-MM-DD

  try {
    // Fetch slots for the given date
    const slots: ISlot[] = await Slot.find({ date })
      .sort({ startTime: 1 });  // Sorting by start time

    if (slots.length === 0) {
      return res.status(404).json({ message: "No slots found for the given date" });
    }

    // Format the slot details to include required info
    const formattedSlots = slots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedCount: slot.bookedUsers.length,
      remainingCapacity: slot.capacity - slot.bookedUsers.length,
    }));

    return res.status(200).json({ slots: formattedSlots });
  } catch (error) {
    console.error("Error fetching slot details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVaccinationSlotDetails = async (date: string, pincode: string) => {
  try {
    // Fetch the slots for the given date and pincode, and populate bookedUsers with full user data
    const slots = await Slot.find({ date, pincode }).populate("bookedUsers");

    let firstDoseSlots = 0;
    let secondDoseSlots = 0;
    let totalRegisteredSlots = 0;

    slots.forEach((slot) => {
      slot.bookedUsers.forEach((user) => {
        // Type assertion to tell TypeScript this is an IUser
        const bookedUser = user as IUser;

        if (bookedUser.vaccinationStatus.firstDose.vaccinated) {
          firstDoseSlots += 1;
        }

        if (bookedUser.vaccinationStatus.secondDose.vaccinated) {
          secondDoseSlots += 1;
        }
      });

      totalRegisteredSlots += slot.bookedUsers.length;
    });

    return {
      firstDoseSlots,
      secondDoseSlots,
      totalRegisteredSlots,
    };
  } catch (error) {
    console.error("Error fetching vaccination slot details:", error);
    throw new Error("Failed to fetch vaccination slot details.");
  }
};
// export const getVaccinationSlotDetails = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   const { date } = req.params; // Date format: YYYY-MM-DD

//   try {
//     // Fetch all slots for the given date
//     const slots = await Slot.find({ date });

//     if (slots.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No slots found for the given date" });
//     }

//     let firstDoseSlots = 0;
//     let secondDoseSlots = 0;
//     let totalRegisteredSlots = 0;

//     // Calculate the registered slots for first dose, second dose, and total
//     slots.forEach((slot) => {
//       firstDoseSlots += slot.bookedUsers.filter(
//         (user) => user.vaccinationStatus.firstDose.vaccinated
//       ).length;
//       secondDoseSlots += slot.bookedUsers.filter(
//         (user) => user.vaccinationStatus.secondDose.vaccinated
//       ).length;
//       totalRegisteredSlots += slot.bookedUsers.length;
//     });

//     return res.status(200).json({
//       firstDoseSlots,
//       secondDoseSlots,
//       totalRegisteredSlots,
//       totalSlotsAvailable: slots.length * 10, // Assuming 10 doses per slot
//     });
//   } catch (error) {
//     console.error("Error fetching vaccination slot details:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

export const filterUsers = async (req: Request, res: Response): Promise<any> => {
  const { age, pincode, vaccinationStatus } = req.query;

  const filterConditions: any = {};

  // Add age filter if provided
  if (age) {
    filterConditions.age = age;
  }

  // Add pincode filter if provided
  if (pincode) {
    filterConditions.pincode = pincode;
  }

  // Add vaccination status filter if provided
  if (vaccinationStatus) {
    if (vaccinationStatus === "firstDose") {
      filterConditions["vaccinationStatus.firstDose.vaccinated"] = true;
    } else if (vaccinationStatus === "secondDose") {
      filterConditions["vaccinationStatus.secondDose.vaccinated"] = true;
    }
  }

  try {
    const users = await User.find(filterConditions);
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getSlotsByDate = async (req: Request, res: Response): Promise<any> => {
  const { date } = req.query;

  try {
    // Find all slots for the given date
    const slots = await Slot.find({ date });

    // Filter and check if slots are fully booked
    const availableSlots = slots.filter((slot) => slot.bookedUsers.length < 10);

    return res.status(200).json({
      availableSlots,
      totalSlots: slots.length,
      fullyBookedSlots: slots.length - availableSlots.length,
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return res.status(500).json({ message: "Error fetching slots", error });
  }
};