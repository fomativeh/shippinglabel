const { Telegraf } = require("telegraf");
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();
const express = require("express");
const app = express();
const { Schema, model, default: mongoose } = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const Queue = require("queue-promise");
const handleError = require("./helpers/handleError");
const showMenu = require("./helpers/showMenu");
const createPDF = require("./helpers/createPDF");
const ms = require("./pdfString");
const courierData = require("./utils/courierData");
const generateKeyboard = require("./helpers/generateKeyboard");
const generateTimeframeMessage = require("./helpers/generateTimeframeMessage");
const { default: axios } = require("axios");
const handleCsvUpload = require("./helpers/handleCsvUpload");
const checkBalance = require("./helpers/checkBalance");
const resetAppState = require("./helpers/resetAppState");
const initUserAccount = require("./helpers/initUserAccount");
const User = require("./models/userSchema");
const createInvoice = require("./helpers/createInvoice");
const checkForPayment = require("./helpers/checkForPayment");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Create a queue instance
const queue = new Queue({
  concurrent: 25, // Process one request at a time
  interval: 3000, // Interval between dequeue operations (1 second)
});

app.use(
  cors({
    origin: "*",
  })
);

let appState = {
  courier: "",
  isCreatingLabel: false,
  serviceSpeed: "",
  bulkLabel: false,
  waitingForCsv: false,
  balance: null,
  btcAddress: null,
  ltcAddress: null,
  tokenToTopup: "",
  topupIsInProgress: false,
};

// Parse URL-encoded bodies (deprecated in Express v4.16+)
app.use(bodyParser.urlencoded({ extended: false }));

// Parse JSON bodies
app.use(express.json());

//Start command
bot.start(async (ctx) => {
  resetAppState(appState);
  const user = await User.findOne({ id: ctx.from.id });
  const { balance, btcAddress, ltcAddress } = user;
  appState = { ...appState, btcAddress, ltcAddress, balance };
  queue.enqueue(async () => {
    try {
      await initUserAccount(ctx);
      await showMenu(ctx, appState.balance);
    } catch (error) {
      handleError(ctx, error);
    }
  });
});

//Button handlers
bot.hears("🧾 Generate Label", async (ctx) => {
  queue.enqueue(async () => {
    try {
      let message = `📦 *Blue Print Ship*

Your balance is currently ${appState.balance} USD

📌 Domestic Labels Only!

Choose a country 👇`;
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [
            [{ text: "🇺🇸 US" }, { text: "🇨🇦 CA (Unavailable)" }],
            [{ text: "🔙 Main Menu" }],
          ],
          resize_keyboard: true,
        },
      });
    } catch (error) {
      handleError(ctx, error);
    }
  });
});

bot.hears("🗃 Bulk Labels", async (ctx) => {
  queue.enqueue(async () => {
  appState.bulkLabel = true
    try {
      let message = `📦 *Blue Print Ship*

Your balance is currently ${appState.balance} USD

📌 Domestic Labels Only!

Choose a country 👇`;
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [
            [{ text: "🇺🇸 US" }, { text: "🇨🇦 CA (Unavailable)" }],
            [{ text: "🔙 Main Menu" }],
          ],
          resize_keyboard: true,
        },
      });
    } catch (error) {
      handleError(ctx, error);
    }
  });
});

bot.hears("🔙 Main Menu", async (ctx) => {
  resetAppState(appState);
  const user = await User.findOne({ id: ctx.from.id });
  const { balance, btcAddress, ltcAddress } = user;
  appState = { ...appState, btcAddress, ltcAddress, balance };
  queue.enqueue(async () => {
    try {
      await showMenu(ctx, appState.balance);
    } catch (error) {
      handleError(ctx, error);
    }
  });
});

bot.hears("❌ Cancel", async (ctx) => {
  if (appState.topupIsInProgress) {
    ctx.reply("Cancelling. Please wait...");
    const user = await User.findOne({ id: ctx.from.id });
    user.topupIsInProgress = false; //This state exists in db so that it can be accessed by the checkForPayment fn to stop the loop
    await user.save();
    await ctx.reply("Invoice cancelled ❌");
  }

  resetAppState(appState);
  queue.enqueue(async () => {
    try {
      await showMenu(ctx, appState.balance);
    } catch (error) {
      handleError(ctx, error);
    }
  });
});

bot.hears("🇺🇸 US", async (ctx) => {
  queue.enqueue(async () => {
    const message = `📦 *Blue Print Ship*

Your balance is currently ${appState.balance} USD

Choose a courier 👇`;
    await ctx.reply(message, {
      parse_mode: "Markdown",

      reply_markup: {
        keyboard: [
          [{ text: "UPS" }],
          [{ text: "USPS" }],
          [{ text: "🔙 Main Menu" }],
        ],
        resize_keyboard: true,
      },
    });
  });
});

bot.hears("🏦 Add Balance", async (ctx) => {
  queue.enqueue(async () => {
    const message = `📦 *Blue Print Ship*

Your balance is currently ${appState.balance} USD

How would you like to pay? 👇`;
    await ctx.reply(message, {
      parse_mode: "Markdown",

      reply_markup: {
        keyboard: [[{ text: "BTC" }, { text: "LTC" }], [{ text: "❌ Cancel" }]],
        resize_keyboard: true,
      },
    });
  });
});

bot.hears("UPS", async (ctx) => {
  queue.enqueue(async () => {
    appState.courier = "UPS";

    const timeframesAndSpeed = courierData.ups;
    const message = await generateTimeframeMessage(
      courierData.ups,
      bot,
      ctx,
      appState
    );
    await ctx.reply(message, generateKeyboard(timeframesAndSpeed));
  });
});

bot.hears("USPS", async (ctx) => {
  queue.enqueue(async () => {
    appState.courier = "USPS";

    const timeframesAndSpeed = courierData.usps;
    const message = await generateTimeframeMessage(
      courierData.usps,
      bot,
      ctx,
      appState
    );
    await ctx.reply(message, generateKeyboard(timeframesAndSpeed));
  });
});

bot.hears("BTC", async (ctx) => {
  queue.enqueue(async () => {
    appState.tokenToTopup = "BTC";

    await createInvoice(appState, ctx);
  });
});

bot.hears("LTC", async (ctx) => {
  queue.enqueue(async () => {
    appState.tokenToTopup = "LTC";

    await createInvoice(appState, ctx);
  });
});

bot.on("document", async (ctx) => {
  if (!appState.waitingForCsv) {
    return await ctx.reply("Please use the menu before uploading a file.");
  }

  await handleCsvUpload(ctx, appState);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

//Connect to DB
const URI = process.env.URI;
mongoose
  .connect(URI)
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => console.log(err));

// Log a message when the bot is connected
bot.telegram
  .getMe()
  .then((botInfo) => {
    console.log(`Bot ${botInfo.username} is connected and running.`);
    bot.launch();
  })
  .catch((err) => {
    console.error("Error connecting bot:", err);
  });

