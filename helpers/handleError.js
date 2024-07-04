module.exports = handleError = (ctx, error) => {
  if (ctx) {
    ctx.reply("An error occured");
  }
  console.log(error);
};
