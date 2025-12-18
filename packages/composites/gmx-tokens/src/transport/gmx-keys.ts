import { AbiCoder, getAddress, keccak256 } from 'ethers'

const abi = AbiCoder.defaultAbiCoder()
const DATA_STREAM_ID = keccak256(abi.encode(['string'], ['DATA_STREAM_ID']))

function hashData(types: string[], values: unknown[]): string {
  return keccak256(abi.encode(types, values))
}

export function dataStreamIdKey(token: string): string {
  return hashData(['bytes32', 'address'], [DATA_STREAM_ID, getAddress(token)])
}
