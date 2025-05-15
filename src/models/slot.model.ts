import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from "./user.model"; // ✅ Import the IUser interface

export interface ISlot extends Document {
  startTime: string; // e.g. "10:00"
  endTime: string; // e.g. "10:30"
  capacity: number;
  bookedUsers: (Types.ObjectId | IUser)[]; // ✅ Allow populated user objects or IDs
  date: string; // e.g. "2024-11-05"
}

const slotSchema = new Schema<ISlot>(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true },
    bookedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    date: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const Slot = mongoose.model<ISlot>("Slot", slotSchema);
export default Slot;
