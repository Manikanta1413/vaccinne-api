import { Request, Response } from "express";
import Slot from "../models/slot.model";
import User from "../models/user.model";
import mongoose from "mongoose";

// ✅ Get Available Slots
export const getAvailableSlots = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { date, pincode, doseType } = req.query;

  if (!date || !pincode || !doseType) {
    return res
      .status(400)
      .json({ message: "Date, pincode and doseType are required" });
  }

  try {
    const slots = await Slot.find({
      date,
      pincode,
      doseType,
      $where: "this.bookedUsers.length < this.capacity",
    });

    return res.status(200).json({ availableSlots: slots });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch slots", error });
  }
};

// ✅ Book Slot (Step 6.2 logic)
export const bookSlot = async (req: Request, res: Response): Promise<any> => {
  const userId = (req as any).user.id; // from auth middleware
  const { slotId, doseType } = req.body;

  if (!slotId || !doseType) {
    return res
      .status(400)
      .json({ message: "Slot ID and dose type are required" });
  }

  if (!["first", "second"].includes(doseType)) {
    return res.status(400).json({ message: "Invalid dose type" });
  }

  try {
    const user = await User.findById(userId);
    const slot = await Slot.findById(slotId);

    if (!user || !slot) {
      return res.status(404).json({ message: "User or Slot not found" });
    }

    if (slot.doseType !== doseType) {
      return res.status(400).json({ message: "Slot dose type mismatch" });
    }

    if (slot.bookedUsers.length >= slot.capacity) {
      return res.status(400).json({ message: "Slot is fully booked" });
    }

    if (doseType === "first" && user.vaccinationStatus.firstDose.slotId) {
      return res.status(400).json({ message: "First dose already booked" });
    }

    if (doseType === "second") {
      if (!user.vaccinationStatus.firstDose.vaccinated) {
        return res
          .status(400)
          .json({ message: "First dose must be completed first" });
      }
      if (user.vaccinationStatus.secondDose.slotId) {
        return res.status(400).json({ message: "Second dose already booked" });
      }
    }

    // Book user into slot
    slot.bookedUsers.push(user.id);
    await slot.save();

    // Update user's vaccinationStatus
    if (doseType === "first") {
      user.vaccinationStatus.firstDose.slotId = slot.id;
    } else {
      user.vaccinationStatus.secondDose.slotId = slot.id;
    }

    await user.save();

    return res.status(200).json({ message: "Slot booked successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error booking slot", error });
  }
};

export const updateSlot = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { userId, newSlotId, doseType } = req.body;

    if (!userId || !newSlotId || !doseType) {
      return res
        .status(400)
        .json({ message: "userId, newSlotId, and doseType are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentSlotId =
      doseType === "first"
        ? user.vaccinationStatus.firstDose.slotId
        : user.vaccinationStatus.secondDose.slotId;

    if (!currentSlotId) {
      return res
        .status(400)
        .json({ message: `User hasn't booked ${doseType} dose slot yet` });
    }

    const currentSlot = await Slot.findById(currentSlotId);
    const newSlot = await Slot.findById(newSlotId);

    if (!currentSlot || !newSlot) {
      return res.status(404).json({ message: "Old or new slot not found" });
    }

    // Check if the user is allowed to change slot (must be 24 hours before old slot time)
    const currentTime = new Date();
    const slotTime = new Date(currentSlot.dateTime); // assume slot.dateTime field exists
    const timeDiff =
      (slotTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60); // in hours

    if (timeDiff < 24) {
      return res
        .status(400)
        .json({
          message: "Cannot change slot within 24 hours of scheduled time",
        });
    }

    // Remove user from old slot
    currentSlot.bookedUsers = currentSlot.bookedUsers.filter(
      (id: any) => id.toString() !== user.id.toString()
    );
    await currentSlot.save();

    // Add user to new slot
    if (newSlot.bookedUsers.length >= newSlot.capacity) {
      return res.status(400).json({ message: "Selected slot is already full" });
    }
    newSlot.bookedUsers.push(user.id);
    await newSlot.save();

    // Update user's booked slot
    if (doseType === "first") {
      user.vaccinationStatus.firstDose.slotId = newSlot.id;
    } else {
      user.vaccinationStatus.secondDose.slotId = newSlot.id;
    }

    await user.save();

    return res.status(200).json({ message: "Slot updated successfully" });
  } catch (error) {
    console.error("Update Slot Error:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const markUsersAsVaccinated = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const now = new Date();

    // Find all slots whose time has passed
    const expiredSlots = await Slot.find({ dateTime: { $lt: now } });

    for (const slot of expiredSlots) {
      const users = await User.find({
        _id: { $in: slot.bookedUsers },
      });

      for (const user of users) {
        // Check if this user was booked for first or second dose
        if (
          user.vaccinationStatus.firstDose.slotId?.toString() ===
            slot.id.toString() &&
          !user.vaccinationStatus.firstDose.vaccinated
        ) {
          user.vaccinationStatus.firstDose.vaccinated = true;
        }

        if (
          user.vaccinationStatus.secondDose.slotId?.toString() ===
            slot.id.toString() &&
          !user.vaccinationStatus.secondDose.vaccinated
        ) {
          user.vaccinationStatus.secondDose.vaccinated = true;
        }

        await user.save();
      }
    }

    return res.status(200).json({
      message: "Vaccination status updated for expired slots",
    });
  } catch (error) {
    console.error("Error in markUsersAsVaccinated:", error);
    return res.status(500).json({
      message: "Failed to update vaccination statuses",
      error,
    });
  }
};