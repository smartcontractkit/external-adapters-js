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
