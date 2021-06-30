import { Config as DefaultConfig } from "@chainlink/types"

export type Config = DefaultConfig & {
  endpoint: string,
  infuraHost: string
}

export const INFURA_HOST = process.env.INFURA_HOST || ""
export const USDT_USD_AGGREGATOR_V3_ADDRESS = process.env.AGGREGATOR_V3_ADDRESS || "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D"

export const PRICE = "price"

export const USD = "USD"
export const ETH = "ETH"
export const WETH = "WETH"
export const USDT = "USDT"

export const UNISWAP_V2_GRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2"

export const makeConfig = (): Config => {
  return {
    endpoint: UNISWAP_V2_GRAPH_ENDPOINT,
    infuraHost: INFURA_HOST
  }
}
