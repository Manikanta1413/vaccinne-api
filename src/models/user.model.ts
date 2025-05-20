import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  phoneNumber: string;
  password: string;
  aadharNumber: string;
  pinCode: string;
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
    pinCode: { type: String, required: true },
    age: { type: Number, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
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

userSchema.index({ pinCode: 1, age: 1, role: 1 });
userSchema.index({ role: 1, "vaccinationStatus.firstDose.vaccinated": 1 });
userSchema.index({ role: 1, "vaccinationStatus.secondDose.vaccinated": 1 });

const User = mongoose.model<IUser>("User", userSchema);
export default User;

