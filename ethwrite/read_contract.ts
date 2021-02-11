import { ethers } from 'ethers'
import { DEFAULT_RPC_URL } from './src/config'

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || DEFAULT_RPC_URL)

const abi = [
  'function setBytes32(bytes32 _value)',
  'function getBytes32() view returns (bytes32)',
  'function setInt256(int256 _value)',
  'function getInt256() view returns (int256)',
  'function setUint256(uint256 _value)',
  'function getUint256() view returns (uint256)',
]

// https://docs.ethers.io/ethers.js/html/api-contract.html#connecting-to-existing-contracts
;(async function () {
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS || '', abi, provider)
  console.log('Reading contract:', process.env.CONTRACT_ADDRESS)

  const bytesValue = await contract.getBytes32()
  console.log('Bytes32 value:', bytesValue)

  const intValue = await contract.getInt256()
  console.log('Int256 value:', intValue)

  const uintValue = await contract.getUint256()
  console.log('Uint256 value:', uintValue)
})()
