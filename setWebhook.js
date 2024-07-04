const axios = require('axios');

module.exports = setWebhook = async (walletAddress, token) => {
  const url = `https://api.blockcypher.com/v1/${token.toLowerCase()}/main/hooks?token=${process.env.BLOCKCYPHER_TOKEN}`;
  const data = {
    event: 'confirmed-tx',
    address: walletAddress,
    url: 'https://shippinglabel.onrender.com/webhook-endpoint', // Your webhook endpoint
  };

  try {
    const response = await axios.post(url, data);
    console.log('Webhook registered:', response.data);
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
};