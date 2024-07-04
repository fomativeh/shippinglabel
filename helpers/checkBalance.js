const { default: axios } = require("axios");

module.exports = checkBalance = async(walletAddress, chainToCheck)=>{
    let chain = chainToCheck.toLowerCase()
    let url = `https://api.blockcypher.com/v1/${chain}/main/addrs/${walletAddress}/balance`
    const res = await fetch(url);
    let resDetails = await res.json()
    const {error} = resDetails

    if(error){
        console.log(error)
        return null
    }
    
    console.log(resDetails.balance/Math.pow(10, 8))
    // return resDetails.balance/Math.pow(10, 8)
}