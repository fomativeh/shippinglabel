const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

module.exports = createPDF = async (base64String) =>{
  // Decode the base64 string
  const pdfData = Buffer.from(base64String, 'base64');

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfData);

  // Save the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
