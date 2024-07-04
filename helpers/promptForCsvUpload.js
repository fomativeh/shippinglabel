const User = require("../models/userSchema");
const handleError = require("./handleError");
const path = require("path");

module.exports = promptForCsvUpload = async (ctx, bot, serviceSpeed, appState) => {
  const user = await User.findOne({id:ctx.from.id})
  const {balance} = user
  try {
    appState.serviceSpeed = serviceSpeed;
    appState.waitingForCsv = true;

    if(balance <1){
      return ctx.reply("Insufficient balance. Please topup.")
    }

    const caption = `📦 *Blue Print Ship*

🗒️ *Format*

FromCountry, FromName, FromCompany, FromPhone, FromStreet1, FromStreet2, FromCity, FromZip, FromState, ToCountry, ToName, ToCompany, ToPhone, ToStreet1, ToStreet2, ToCity, ToZip, ToState, Length, Height, Width, Weight

Please download the file above, fill it then upload 👇`;

    const filePath = path.join(
      __dirname,
      "..",
      "assets",
      "documents",
      "csv_template.csv"
    );

    ctx.replyWithDocument(
      { source: filePath }, // Replace with the path to your file
      {
        caption,
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: "🔙 Main Menu" }]],
          resize_keyboard: true,
        },
      }
    );
  } catch (error) {
    handleError(ctx, error);
  }
};
