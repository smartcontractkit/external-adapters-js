import { ethers } from 'ethers'
import { abi } from './src/contract_helpers'
// https://docs.ethers.io/ethers.js/html/api-contract.html#connecting-to-existing-contracts
;(async function () {
  if (process.env.CONTRACT_ADDRESS) {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider)
    console.log('Reading contract:', process.env.CONTRACT_ADDRESS)

    const bytesValue = await contract.getBytes32()
    console.log('Bytes32 value:', bytesValue)

    const intValue = await contract.getInt256()
    console.log('Int256 value:', intValue)

    const uintValue = await contract.getUint256()
    console.log('Uint256 value:', uintValue)
  } else {
    console.log('Please set CONTRACT_ADDRESS env variable')
  }
})()
