const { model, Schema } = require("mongoose");

const transactionSchema = new Schema(
  {
    hash: String,
    amount: Number,
    userId: String,
    token: String,
  },
  { timestamps: true }
);

const Transaction = model("Transaction", transactionSchema);
module.exports = Transaction;