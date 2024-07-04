const { default: axios } = require("axios");
const path = require("path")
const csv = require("csv-parser");
const fetchPDFData = require("./fetchPDFData");
const fs = require("fs")



module.exports = handleCsvUpload = async (ctx, appState)=>{

    const file = ctx.message.document;
    const fileId = ctx.message.document.file_id;
    const fileName = file.file_name;
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    const mimeType = file.mime_type;

    const allowedMimeTypes = ['text/csv', 'text/comma-separated-values'];
    if (!allowedMimeTypes.includes(mimeType) || !fileName.toLowerCase().endsWith('.csv')) {
      return await ctx.reply('Please upload a valid CSV file.');
    }
  
    const filePath = path.join(__dirname, 'temp.csv');
  
    try {
      // Download the file using axios
      const response = await axios({
        url: fileUrl.href,
        method: 'GET',
        responseType: 'stream',
      });
  
      // Save the file to the temp path
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
  
      writer.on('finish', () => {
        // Parse the CSV file
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            fs.unlinkSync(filePath); // Delete the file after processing
            await fetchPDFData(results, ctx, appState)
          });
      });
  
      writer.on('error', (err) => {
        console.error('Error writing file', err);
        ctx.reply('There was an error processing the file.');
      });
    } catch (error) {
      console.error('Error downloading file', error);
      ctx.reply('There was an error downloading the file.');
    }
}