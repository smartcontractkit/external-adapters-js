import { BigNumber } from 'ethers'

export * as resolveMarkets from './resolveMarkets'
export * as createMarkets from './createMarkets'

export const ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "_payload", type: "bytes32" }
    ],
    name: "createMarket",
    outputs: [
      { internalType: "uint256[3]", name: "_ids", type: "uint256[3]" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs:[
      { internalType: "uint256", name: "_eventId", type: "uint256" }
    ],
    name: "isEventRegistered",
    outputs: [
      { internalType: "bool", name: "", type: "bool"}
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256", name: "_eventId", type: "uint256" },
    ],
    name: "getEventMarkets",
    outputs: [
      { internalType: "uint256[3]", name: "", type: "uint256[3]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_payload", type: "bytes32" }
    ],
    name: "trustedResolveMarkets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "listResolvableEvents",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export const eventIdToNum = (eventId: string): BigNumber => BigNumber.from(`0x${eventId}`)
export const numToEventId = (num: BigNumber): string => num.toHexString().slice(2);

export const bytesMappingToHexStr = (mapping: number[], encoded: string): string => {
  const buf = Buffer.from(encoded.substr(2), 'hex')

  // Get only the mapped amount of bytes
  const elems = mapping.map((bytes, index) => {
    const offset = 32 * (index+1)
    return buf.slice(offset - bytes, offset)
  })

  // Right pad string to get 32 bytes
  const missingBytes = 32 - mapping.reduce((sum, bytes) => sum + bytes)
  elems.push(...new Array(missingBytes).fill(new Uint8Array(1).fill(0)))
  return `0x${Buffer.concat(elems).toString('hex')}`
}

export const sportIdMapping: { [sport: string]: number } = {
  MLB: 3,
  NBA: 4,
}

export const sportDataProviderMapping: { [dataProvider: string]: string[] } = {
  theRundown: ['MLB', 'NBA'],
  sportsdataio: ['MMA']
}
