const CoinKey = require("coinkey");

module.exports = generateBTCAddress = async () => {
  var wallet = new CoinKey.createRandom();

  // console.log("SAVE BUT DO NOT SHARE THIS:", wallet.privateKey.toString("hex"));
  // console.log("Address:", wallet.publicAddress);
  return {privateKey:wallet.privateKey.toString("hex"), publicKey:wallet.publicAddress}
};
