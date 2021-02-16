import { ethers } from 'ethers'

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)

export const abi = [
  'function setBytes32(bytes32 _value)',
  'function getBytes32() view returns (bytes32)',
  'function setInt256(int256 _value)',
  'function getInt256() view returns (int256)',
  'function setUint256(uint256 _value)',
  'function getUint256() view returns (uint256)',
]

// https://docs.ethers.io/ethers.js/html/api-contract.html#connecting-to-existing-contracts
;(async function () {
  if (process.env.CONTRACT_ADDRESS) {
    console.log('Address')
    console.log(process.env.CONTRACT_ADDRESS)
    console.log('ABI')
    console.log(abi)
    console.log('Provider')
    console.log(provider)
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
