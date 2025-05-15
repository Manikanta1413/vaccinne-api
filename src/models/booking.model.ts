import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  slot: mongoose.Types.ObjectId;
  dose: 1 | 2;
  status: "booked" | "completed" | "cancelled";
}

const bookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slot: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
    dose: { type: Number, enum: [1, 2], required: true },
    status: {
      type: String,
      enum: ["booked", "completed", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);
