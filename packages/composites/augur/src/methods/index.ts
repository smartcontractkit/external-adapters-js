import { BigNumber } from 'ethers'

export * as resolveMarkets from './resolveMarkets'
export * as createMarkets from './createMarkets'

export interface Event {
  event_id: string
  event_date: string
  lines?: {
    [key: string]: {
      affiliate: {
        affiliate_id: number
      }
      spread: {
        point_spread_home: number
      }
    }
  }
  score: {
    event_status: string
    score_home: number
    score_away: number
  }
  teams: {
    is_away: boolean
    is_home: boolean
    team_id: number
  }[]
}

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
      { internalType: "uint256", name: "_eventId", type: "uint256" }
    ],
    name: "isEventResolved",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_payload", type: "bytes32" }
    ],
    name: "trustedResolveMarkets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
]

export const eventIdToNum = (eventId: string): BigNumber => BigNumber.from(`0x${eventId}`)

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
