module.exports = generateLTCAddress = async () => {
  const bitcore = require("bitcore-lib-ltc");

  // Generate a random private key
  const privateKey = new bitcore.PrivateKey();

  // Get the public key from the private key
  const publicKey = privateKey.publicKey;

  // Create an address from the public key
  const address = publicKey.toAddress();

  // console.log('Litecoin Address:', address.toString());
  return { publicKey: address.toString(), privateKey };
};
