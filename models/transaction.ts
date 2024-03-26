import mongoose from "mongoose";

const receivedTXSchema = new mongoose.Schema(
  {
    signature: { type: String, require: true },
    sender: { type: String, require: true },
    sentTime: { type: Date, require: true },
    amount: { type: Number, require: true },
    status: { type: Number, require: true, default: 0 }, // 0: insert, 1: process
  },
  {
    timestamps: {
      createdAt: "created_at",
    },
  }
);

export const receivedTXModal = mongoose.model("transaction", receivedTXSchema);
