const { model, Schema } = require("mongoose");

const userSchema = new Schema(
  {
    username: String,
    first_name: String,
    last_name: String,
    id: String,
    balance: Number,
    topupIsInProgress: { type: Boolean, default: false },
    btcAddress: {
      publicKey: String,
      privateKey: String,
    },
    ltcAddress: {
      publicKey: String,
      privateKey: String,
    },
  },
  { timestamps: true }
);

const User = model("User", userSchema);
module.exports = User;
