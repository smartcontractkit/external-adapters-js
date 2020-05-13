const ethers = require('ethers')
const web3 = require('web3')
const rpcUrl = process.env.RPC_URL

const getProvider = (callback) => {
  if (rpcUrl.startsWith('ws')) {
    const web3prov = new web3.providers.WebsocketProvider(rpcUrl)
    callback(new ethers.providers.Web3Provider(web3prov), () => {
      web3prov.disconnect(1000, '')
    })
  } else {
    callback(new ethers.providers.JsonRpcProvider(rpcUrl), () => {})
  }
}

const getContractPrice = async (contractAddress) => {
  return new Promise((resolve, reject) => {
    getProvider((provider, done) => {
      const ABI = [
        'function latestAnswer() external view returns (int256)'
      ]
      const contract = new ethers.Contract(contractAddress, ABI, provider)
      contract.latestAnswer().then(resolve).catch(reject).finally(done)
    })
  })
}

exports.getContractPrice = getContractPrice
