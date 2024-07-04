const User = require("../models/userSchema");
const generateBTCAddress = require("./generateBTCAddress");
const generateLTCAddress = require("./generateLTCAddress");
const handleError = require("./handleError");

module.exports = initUserAccount = async (ctx) => {
  try {
    const { id, username, first_name, last_name } = ctx.from;
    //Check if user already exists
    const userExists = await User.findOne({ id });

    //Create an account if absent
    if (!userExists) {
      const newBtcAddress = await generateBTCAddress();
      const newLtcAddress = await generateLTCAddress()

      const newUser = new User({
        id,
        username,
        first_name,
        last_name,
        balance: 0,
        btcAddress: {
          publicKey: newBtcAddress.publicKey,
          privateKey: newBtcAddress.privateKey,
        },
        ltcAddress:{
            publicKey: newLtcAddress.publicKey,
            privateKey: newLtcAddress.privateKey,
        }
      });
      await newUser.save()
    }
  } catch (error) {
    handleError(ctx, error);
  }
};
