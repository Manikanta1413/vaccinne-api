  import mongoose, { Schema, Document, Types } from "mongoose";
  import { IUser } from "./user.model"; 

  export interface ISlot extends Document {
    startTime: string;
    endTime: string;
    capacity: number;
    bookedUsers: (Types.ObjectId | IUser)[];
    date: string;
    doseType: "first" | "second";
    pinCode: string; 
  }

  const slotSchema = new Schema<ISlot>(
    {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      capacity: { type: Number, required: true },
      bookedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      date: { type: String, required: true, index: true },
      doseType: {
        type: String,
        enum: ["first", "second"],
        required: true,
      },
      pinCode: { type: String, required: true, index: true },
    },
    { timestamps: true }
  );

  const Slot = mongoose.model<ISlot>("Slot", slotSchema);
  export default Slot;
