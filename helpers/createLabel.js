const createPDF = require("./createPDF");
const handleError = require("./handleError");

module.exports = createLabel = async (base64String, ctx, pdfIndex) => {
  const filename = pdfIndex ? `Label_${pdfIndex}.pdf` : "Label.pdf";
  try {
    const pdfBytes = await createPDF(base64String);
    await ctx.replyWithDocument({
      source: pdfBytes,
      filename,
    });
  } catch (error) {
    handleError(ctx, error);
  }
};
