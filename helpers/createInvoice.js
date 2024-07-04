const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const handleError = require("./handleError");
const checkForPayment = require("./checkForPayment");
const User = require("../models/userSchema");
const setWebhook = require("../setWebhook");

module.exports = createInvoice = async (appState, ctx) => {
  try {
    appState.topupIsInProgress = true;
    const user = await User.findOne({ id: ctx.from.id });
    console.log(appState);
    user.topupIsInProgress = true;
    await user.save();

    await ctx.reply("Generating invoice. Please wait...");
    const wallletAddress =
      appState.tokenToTopup == "BTC"
        ? appState.btcAddress.publicKey
        : appState.ltcAddress.publicKey;

    // Generate QR Code
    const qrFilePath = path.join(__dirname, "qrcode.png");
    await QRCode.toFile(
      qrFilePath,
      `Your ${appState.tokenToTopup} wallet address is: ${wallletAddress}`,
      {
        width: 300,
        errorCorrectionLevel: "H",
      }
    );

    const caption = `Please topup by sending the desired amount *(in ${appState.tokenToTopup})* to the address below:
    

\`${wallletAddress}\`
_(Tap to copy)_


Upon payment confirmation, your account will be funded and you will be notified.`;

    // Send Barcode image
    await ctx.replyWithPhoto(
      { source: qrFilePath },
      {
        caption,
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: "🔙 Main Menu" }]],
          resize_keyboard: true,
        },
      }
    );

    // Clean up: Delete the QR code file
    fs.unlinkSync(qrFilePath);
    await setWebhook(wallletAddress, appState.tokenToTopup);

    // await checkForPayment(wallletAddress, appState.tokenToTopup, ctx);
  } catch (error) {
    handleError(ctx, error);
  }
};
