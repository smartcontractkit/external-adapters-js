const ethers = require('ethers')
const rpcUrl = process.env.RPC_URL

const getContractPrice = async (contractAddress) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const ABI = [
    'function latestAnswer() external view returns (int256)'
  ]
  const contract = new ethers.Contract(contractAddress, ABI, provider)
  return await contract.latestAnswer()
}

exports.getContractPrice = getContractPrice
