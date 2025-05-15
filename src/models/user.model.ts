// src/models/user.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  phoneNumber: string;
  password: string;
  aadharNumber: string;
  pincode: string;
  age: number;
  role: "user" | "admin";
  vaccinationStatus: {
    firstDose: {
      vaccinated: boolean;
      slotId?: mongoose.Types.ObjectId;
    };
    secondDose: {
      vaccinated: boolean;
      slotId?: mongoose.Types.ObjectId;
    };
  };
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    pincode: { type: String, required: true, index: true },
    age: { type: Number, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    vaccinationStatus: {
      firstDose: {
        vaccinated: { type: Boolean, default: false },
        slotId: { type: mongoose.Types.ObjectId, ref: "Slot" },
      },
      secondDose: {
        vaccinated: { type: Boolean, default: false },
        slotId: { type: mongoose.Types.ObjectId, ref: "Slot" },
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;

