import { BaseGlobalEndpointTypes } from '../endpoint/utils'
export interface GlobalResponseSchema {
  data: {
    active_cryptocurrencies: number
    total_cryptocurrencies: number
    active_market_pairs: number
    active_exchanges: number
    total_exchanges: number
    eth_dominance: number
    btc_dominance: number
    eth_dominance_yesterday: number
    btc_dominance_yesterday: number
    eth_dominance_24h_percentage_change: number
    btc_dominance_24h_percentage_change: number
    defi_volume_24h: number
    defi_volume_24h_reported: number
    defi_market_cap: number
    defi_24h_percentage_change: number
    stablecoin_volume_24h: number
    stablecoin_volume_24h_reported: number
    stablecoin_market_cap: number
    stablecoin_24h_percentage_change: number
    derivatives_volume_24h: number
    derivatives_volume_24h_reported: number
    derivatives_24h_percentage_change: number
    quote: {
      [key: string]: {
        total_market_cap: number
        total_volume_24h: number
        total_volume_24h_reported: number
        altcoin_volume_24h: number
        altcoin_volume_24h_reported: number
        altcoin_market_cap: number
        defi_volume_24h: number
        defi_volume_24h_reported: number
        defi_24h_percentage_change: number
        defi_market_cap: number
        stablecoin_volume_24h: number
        stablecoin_volume_24h_reported: number
        stablecoin_24h_percentage_change: number
        stablecoin_market_cap: number
        derivatives_volume_24h: number
        derivatives_volume_24h_reported: number
        derivatives_24h_percentage_change: number
        last_updated: string
        total_market_cap_yesterday: number
        total_volume_24h_yesterday: number
        total_market_cap_yesterday_percentage_change: number
        total_volume_24h_yesterday_percentage_change: number
      }
    }
    last_updated: string
  }
}

export type GlobalHttpTransportTypes = BaseGlobalEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: GlobalResponseSchema
  }
}

export type ResultPath = 'btc_dominance' | 'eth_dominance'
