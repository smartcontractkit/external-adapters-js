// src/gmx/keys.ts (vendored)
// Source: https://github.com/gmx-io/gmx-synthetics/blob/main/utils/keys.ts
// Source: https://github.com/gmx-io/gmx-synthetics/blob/main/utils/hash.ts

import { AbiCoder, getAddress, keccak256 } from 'ethers'

const abi = AbiCoder.defaultAbiCoder()

// bytes32 constant: keccak256(abi.encode("DATA_STREAM_ID"))
export const DATA_STREAM_ID = keccak256(abi.encode(['string'], ['DATA_STREAM_ID']))

export function hashData(types: string[], values: unknown[]): string {
  return keccak256(abi.encode(types, values))
}

export function dataStreamIdKey(token: string): string {
  return hashData(['bytes32', 'address'], [DATA_STREAM_ID, getAddress(token)])
}
