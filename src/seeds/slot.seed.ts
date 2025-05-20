import mongoose from "mongoose";
import dotenv from "dotenv";
import Slot from "../models/slot.model";

dotenv.config();

// Slot timing config
const startHour = 10;
const endHour = 17; // exclusive

const generateTimeSlots = (): { startTime: string; endTime: string }[] => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${hour.toString().padStart(2, "0")}:30`,
    });
    slots.push({
      startTime: `${hour.toString().padStart(2, "0")}:30`,
      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
    });
  }
  return slots;
};

const seedSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Connected to MongoDB");

    await Slot.deleteMany({});
    console.log("🧹 Cleared old slots");

    const slotTimes = generateTimeSlots();
    const allSlots = [];

    // Since capacity is 10 per slot, 30 days * 14 slots = 420 slots = 4200 doses total
    // We'll use a default doseType and pinCode for all slots here.
    const defaultDoseType = "first"; 
    const defaultPinCode = "500001"; 

    for (let day = 1; day <= 30; day++) {
      const date = `2025-11-${day.toString().padStart(2, "0")}`;

      for (const { startTime, endTime } of slotTimes) {
        allSlots.push({
          date,
          startTime,
          endTime,
          capacity: 10,
          bookedUsers: [],
          doseType: defaultDoseType,
          pinCode: defaultPinCode,
        });
      }
    }

    await Slot.insertMany(allSlots);
    console.log(`✅ Seeded ${allSlots.length} slots successfully`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedSlots();
