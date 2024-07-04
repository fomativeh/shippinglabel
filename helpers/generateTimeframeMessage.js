const Queue = require("queue-promise");
const promptForCsvUpload = require("./promptForCsvUpload");
const User = require("../models/userSchema");
// Create a queue instance
const queue = new Queue({
  concurrent: 25, // Process one request at a time
  interval: 3000, // Interval between dequeue operations (1 second)
});

module.exports = generateTimeframeMessage = async (timeframes, bot, ctx, appState) => {
  const user = await User.findOne({id:ctx.from.id})
  const {balance} = user
  let firstChunk = `📦 *Blue Print Ship*

Your balance is currently \`${balance} USD\`
  
ℹ️ *Timeframes*\n`;

  let lastChunk = `\nChoose a shipping speed 👇`;

  let timeFramesChunk = ``;

  //Generate timeframe texts
  timeframes.forEach((each) => {
    timeFramesChunk += `${each.name}: \`${each.duration}\`\n`;
  });

  //Generate timeframe button handlers
  timeframes.forEach(async (eachTimeFrame) => {
    // console.log(eachTimeFrame)
    bot.hears(`${eachTimeFrame.name} ($1)`, async () => {
      queue.enqueue(async () => {
        await promptForCsvUpload(ctx, bot, eachTimeFrame.name, appState)
      });
    });
  });

  return firstChunk + timeFramesChunk + lastChunk;
};
