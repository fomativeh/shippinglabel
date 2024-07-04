const User = require("../models/userSchema");
const createLabel = require("./createLabel");
const handleError = require("./handleError");
const { default: axios } = require("axios");

const callLabelApi = async (rawDetails, ctx, serviceSpeed, courier, pdfIndex) => {
  try {
    const response = await axios.post(
      `${process.env.API_URL}/${courier.toLowerCase()}/create`,
      {
        uuid: "f6e66db3-63ed-4886-9797-a0c4f8949222",
        country: "US",
        service_speed: `${courier.toUpperCase()} ${serviceSpeed}`,
        sender: {
          name: rawDetails.FromName,
          address1: rawDetails.FromStreet1,
          address2: rawDetails.FromStreet2,
          city: rawDetails.FromCity,
          state: rawDetails.FromState,
          postal_code: rawDetails.FromZip,
          phone: rawDetails.FromPhone,
        },
        recipient: {
          name: rawDetails.ToName,
          address1: rawDetails.ToStreet1,
          address2: rawDetails.ToStreet2,
          city: rawDetails.ToCity,
          state: rawDetails.ToState,
          postal_code: rawDetails.ToZip,
          phone: rawDetails.ToPhone,
        },
        package: {
          length: parseInt(rawDetails.Length),
          width: parseInt(rawDetails.Width),
          height: parseInt(rawDetails.Height),
          weight: parseInt(rawDetails.Weight),
          description: rawDetails.Description,
          references: [],
          saturday_delivery: false,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data)

    await createLabel(response.data.data.label_pdf, ctx, pdfIndex); //Create label with base64 string
  } catch (error) {
    handleError(ctx, error);
  }
};

module.exports = fetchPDFData = async (labelDetails, ctx, appState) => {
  const user = await User.findOne({ id: ctx.from.id });
  const { serviceSpeed, courier, bulkLabel } = appState;
  try {
    let validationError = false;
    //Using for loop instead of [].forEach() so we can use "break" to throw errors
    for (let i = 0; i < labelDetails.length; i++) {
      if (labelDetails[i].Weight > 150) {
        ctx.reply("Weight cannot be greater than 150.");
        validationError = true;
        break;
      }
    }

    if (validationError) return;

    if (bulkLabel) {
      let cost = labelDetails.length;
      if (cost > user.balance) {
        return await ctx.reply(
          `Insufficient balance.\n\n*${cost} USD* is required to print the ${cost} labels in your csv file.\n\nYour current balance is *${balance} USD*.\n\nPlease topup to continue.`
        );
      } else {
        user.balance = (user.balance - cost).toFixed(2)
        await user.save(); //Deduct cost from user's balance

        //Process bulk label printing request
        for (let i = 0; i < labelDetails.length; i++) {
        await ctx.reply(`Generating label ${i+1}. Please wait...`);
          await callLabelApi(labelDetails[i], ctx, serviceSpeed, courier, i + 1);
        }
      }
    } else {
      await ctx.reply("Generating label. Please wait...");
      user.balance = (user.balance - 1).toFixed(2)
      await user.save(); //Deduct cost from user's balance
      const rawDetails = labelDetails[0];
      await callLabelApi(rawDetails, ctx, serviceSpeed, courier);
    }

    //   "uuid": "f6e66db3-63ed-4886-9797-a0c4f8949222",
    //   "country": "US",
    //   "service_speed": serviceSpeed,
    //   "sender": {
    //     "name": rawDetails.FromName,
    //     "address1": rawDetails.FromStreet1,
    //     "address2": rawDetails.FromStreet2,
    //     "city": rawDetails.FromCity,
    //     "state": rawDetails.FromState,
    //     "postal_code": rawDetails.FromZip,
    //     "phone": rawDetails.FromPhone,
    //   },
    //   "recipient": {
    //     "name": rawDetails.ToName,
    //     "address1": rawDetails.ToStreet1,
    //     "address2": rawDetails.ToStreet2,
    //     "city": rawDetails.ToCity,
    //     "state": rawDetails.ToState,
    //     "postal_code": rawDetails.ToZip,
    //     "phone": rawDetails.ToPhone,
    //   },
    //   "package": {
    //     "length": rawDetails.Length,
    //     "width": rawDetails.Width,
    //     "height": rawDetails.Height,
    //     "weight": rawDetails.Weight,
    //     "description": rawDetails.Description,
    //     "references": [],
    //     "saturday_delivery": false,
    //   },
    // })
    // console.log(rawDetails);

    // console.log(`{process.env.API_URL}/${courier.toLowerCase()}/create`)
  } catch (error) {
    // handleError(ctx, error);
    if (error.response) {
      ctx.reply(
        "An error occured. Please make sure your entries are valid, and try again."
      );
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.error("Error response data:", error.response.data);
      console.error("Status code:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request:", error.message);
    }
  }
};
