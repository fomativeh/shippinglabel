const handleError = require("./handleError");
const path = require("path")
const fs = require("fs")
const { Markup } = require("telegraf");
const User = require("../models/userSchema");

module.exports = showMenu = async (ctx, balance) => {
  let caption = `📦 *Welcome to the Blue Print Ship*

Your balance is ${balance} USD

Choose an option below 👇`;

  const photoPath = path.join(__dirname, '..', 'assets', 'images', 'logo.jpg');

  try {
    await ctx.replyWithPhoto(
        { source: fs.createReadStream(photoPath) },
        {
          caption: caption,
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [
              [{ text: '🧾 Generate Label' }, { text: '🗃 Bulk Labels' }], 
              [{ text: '🏦 Add Balance' }]
            ],
            resize_keyboard: true,
          }
        }
      );
  } catch (error) {
    handleError(ctx, error);
  }
};
