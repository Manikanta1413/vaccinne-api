import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import Slot, { ISlot } from "../models/slot.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/admin/login
export const adminLogin = async (req: Request, res: Response) : Promise<any> => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({ message: "Phone number and password required" });
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
      { expiresIn: "2h" }
    );

    return res.status(200).cookie("token", token, { httpOnly: true }).json({ message: "Login successful", token,
      admin: {
        name: admin.name,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
    });
  } catch (error:any) {
    console.error("Login failed for admin user due to : ", error);
    return res.status(400).json({ message: "Login failed", error:error.message });
  }
};

// GET /api/admin/users?age=XX&pinCode=YYYY&vaccinationStatus=none|firstDose|all
// export const getUsersWithFilters = async (req: Request, res: Response) => {
//   try {
//     const { age, pinCode, vaccinationStatus } = req.query;
//     const query: any = { role: "user" };
//     if (age) query.age = age;
//     if (pinCode) query.pinCode = pinCode;

//     if (vaccinationStatus) {
//       if (vaccinationStatus === "none") {
//         query["vaccinationStatus.firstDose.vaccinated"] = false;
//       } else if (vaccinationStatus === "firstDose") {
//         query["vaccinationStatus.firstDose.vaccinated"] = true;
//         query["vaccinationStatus.secondDose.vaccinated"] = false;
//       } else if (vaccinationStatus === "all") {
//         query["vaccinationStatus.secondDose.vaccinated"] = true;
//       }
//     }

//     const start = Date.now();
//     const users = await User.find(query).select("-password");
//     const end = Date.now();
//     console.log(`Fetched ${users.length} users in ${end - start}ms`);

//     const explainResult = await User.find(query).explain("executionStats");
//     console.log(JSON.stringify(explainResult, null, 2));

//     res.json({
//       timeTakenMs: end - start,
//       count: users.length,
//       data: users,
//     });
//   } catch (error:any) {
//     console.error("Failed to fetch users due to :", error);
//     res.status(400).json({ message: "Error fetching users", error: error.message });
//   }
// };
export const getUsersWithFilters = async (req: Request, res: Response) => {
  try {
    const { age, pinCode, vaccinationStatus } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const query: any = { role: "user" };

    if (age) query.age = age;
    if (pinCode) query.pinCode = pinCode;

      if (vaccinationStatus === "none") {
        query["vaccinationStatus.firstDose.vaccinated"] = false;
      } else if (vaccinationStatus === "firstDose") {
        query["vaccinationStatus.firstDose.vaccinated"] = true;
        query["vaccinationStatus.secondDose.vaccinated"] = false;
      } else if (vaccinationStatus === "all") {
        query["vaccinationStatus.secondDose.vaccinated"] = true;
      }
    

    console.time("QueryTime");

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    console.timeEnd("QueryTime");

    res.status(200).json({
      total,
      page,
      limit,
      timeTaken: "Check logs",
      users,
    });
  } catch (error: any) {
    console.error("Fetch error:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};


// GET /api/admin/slot-summary?date=YYYY-MM-DD
export const getSlotSummaryByDate = async (req: Request, res: Response): Promise<any> => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  try {
    const parsedDate = new Date(date as string);
    const isoDate = parsedDate.toISOString().split("T")[0]; // YYYY-MM-DD

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
  } catch (error:any) {
    console.error("Error fetching slot summary:", error);
    return res.status(400).json({ message: "Internal Server Error", error:error.message });
  }
};

// GET /api/admin/slots
export const getAllSlotDetails = async (_req: Request, res: Response): Promise<any> => {
  try {
    const slots = await Slot.find({
      date: { $gte: "2025-11-01", $lte: "2025-11-30" },
    }).sort({ date: 1, startTime: 1 });

    const formattedSlots = slots.map((slot) => ({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedCount: slot.bookedUsers.length,
      remainingCapacity: 10 - slot.bookedUsers.length,
    }));

    return res.status(200).json({ slots: formattedSlots });
  } catch (error:any) {
    console.error("Error fetching slots due to :", error);
    return res.status(400).json({ message: "Error fetching slots ", error:error.message });
  }
};

// GET /api/admin/slots/:date
export const getSlotDetailsByDate = async (req: Request, res: Response): Promise<any> => {
  const { date } = req.params;  // Date format: YYYY-MM-DD

  try {
    // Fetch slots for the given date
    const slots: ISlot[] = await Slot.find({ date })
      .sort({ startTime: 1 });  

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
  } catch (error:any) {
    console.error("Error fetching slot details due to :", error);
    return res.status(400).json({ message: "Error fetching slot details due to : ", error:error.message });
  }
};

// GET /api/admin/slots/:date/:pinCode
export const getVaccinationSlotDetails = async (date: string, pinCode: string)=> {
  try {
    // Fetch the slots for the given date and pinCode, and populate bookedUsers with full user data
    const slots = await Slot.find({ date, pinCode }).populate("bookedUsers");

    let firstDoseSlots = 0;
    let secondDoseSlots = 0;
    let totalRegisteredSlots = 0;

    slots.forEach((slot) => {
      slot.bookedUsers.forEach((user) => {
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
    console.error("Error fetching vaccination slot details due:", error);
    throw new Error("Failed to fetch vaccination slot details.");
  }
};

// POST /api/admin/logout
export const logOut = async (_req: Request, res: Response): Promise<any> => {
  res.clearCookie("token").status(200).json({ message: "Logged out successfully" });
  console.log("👋 User logged out");
};