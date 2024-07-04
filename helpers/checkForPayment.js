const { default: axios } = require("axios");
const Transaction = require("../models/transactionSchema");
const User = require("../models/userSchema");
const handleError = require("./handleError");

const creditAndNotifyUser = async (transaction, token, ctx, user) => {
  const { amount, hash } = transaction;
  try {
    const newTransaction = new Transaction({
      amount,
      hash,
      token,
      userId: ctx.from.id,
    }); //Store transaction in db
    await newTransaction.save();

    // console.log(`https://api.binance.com/api/v3/avgPrice?symbol=${token.toUpperCase()}USDT`)
    //Get current btc price
    const response = await axios.get(
      `https://api.binance.com/api/v3/avgPrice?symbol=${token.toUpperCase()}USDT`,
      {
        timeout: 15000, // Adjust timeout value (in milliseconds) as needed
      }
    );
    const priceInUSD = parseFloat(response.data.price);
    const dollarEquivalent = (amount * priceInUSD).toFixed(2);

    const newBalance = user.balance + dollarEquivalent;
    user.balance = newBalance;
    await user.save();

    //Notify user of payment confirmation

    const message = `Payment confirmed!💰✅
    
A deposit of *${amount} ${token.toUpperCase()}* (${dollarEquivalent} USD) to your account has been confirmed.

Your new account balance is *${parseFloat(newBalance.toString())} USD*
`;
    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    handleError(ctx, error);
  }
};

const checkForNewPayments = async (url, token, ctx, walletAddress) => {
  let invoiceIsExpired = false;
  const timeoutDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

  setTimeout(() => {
    invoiceIsExpired = true;
  }, timeoutDuration); //Cancel topup request after 30 mins

  try {
    const response = await axios.get(url);
    let addressData = response.data;
    if (response.data.error) {
      return console.log("An error occured:", response.data.error);
    }

    if (!addressData?.txrefs) {
      return; // No transactions yet
    }

    const txs = addressData.txrefs;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();

    let recievedTransactions = txs.filter((tx) => tx.tx_output_n !== -1); //Check recieved transactions
    let transactionsToCheck = []; //check transactions within the last 24 hrs
    if (recievedTransactions?.length !== 0) {
      transactionsToCheck = recievedTransactions.filter(
        (e) =>
          new Date(e.confirmed >= yesterday && new Date(e.confirmed) <= today)
      );
    }

    let confirmedTransactions = [];

    transactionsToCheck.forEach((tx) => {
      //   console.log(tx.value);
      let amount = tx.value / Math.pow(10, 8);
      confirmedTransactions.push({
        amount,
        hash: tx.tx_hash,
        confirmed: tx.confirmed,
      });
    });

    const oldPayments = await Transaction.find({ userId: ctx.from.id, token });
    let oldTransactionHashes = [];
    oldPayments.forEach((eachOldPayment) => {
      oldTransactionHashes.push(eachOldPayment.hash);
    });

    for (let i = 0; i < confirmedTransactions.length; i++) {
      if (!oldTransactionHashes.includes(confirmedTransactions[i])) {
        //I didn't fetch the user info in a global scope because we need the latest state of user info for the "invoiceIsExpired" if statement
        const user = await User.findOne({
          $or: [
              { 'btcAddress.publicKey': walletAddress  },
              { 'ltcAddress.publicKey': walletAddress  },
          ]})
        //Update user topup request status
        user.topupIsInProgress = false;
        await user.save();
        invoiceIsExpired = true;
        // console.log(confirmedTransactions[i]);
        // console.log("confirmed. stopped checking");
        //credit user
        await creditAndNotifyUser(confirmedTransactions[i], token, ctx, walletAddress, user);
        break;
      }

      // console.log("Still checking");
    }

    const user = await User.findOne({
      $or: [
          { 'btcAddress.publicKey': walletAddress  },
          { 'ltcAddress.publicKey': walletAddress  },
      ]
  });//Fetching the user here again to obtain the latest state of the user
    if (user.topupIsInProgress) {
      //Will only get here when no new payment is detected
      if (!invoiceIsExpired) {
        //Check for payments again
        await checkForNewPayments(url, token, ctx);
      }
    } else {
      invoiceIsExpired = true; //Invoice gets cancelled when user clicks the "❌ Cancel" button
    }
  } catch (error) {
    handleError(ctx, error);
  }
};

module.exports = checkForPayment = async (walletAddress, tokenToCheck, ctx) => {
  let token = tokenToCheck.toLowerCase();
  const url = `https://api.blockcypher.com/v1/${token}/main/addrs/${walletAddress}`;
  //   const apiKey = '056c9b5816ec488ba8715f0f84da80e6'; // Replace with your Blockcypher API key
  //   const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?token=${apiKey}`;

  try {
    await checkForNewPayments(url, token, ctx, walletAddress);
  } catch (error) {
    handleError(ctx, error);
  }
};
