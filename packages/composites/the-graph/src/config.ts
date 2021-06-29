import { Config as DefaultConfig } from "@chainlink/types"

export type Config = DefaultConfig & {
  endpoint: string
}

export const PRICE = "price"

export const USD = "USD"
export const ETH = "ETH"
export const WETH = "WETH"
export const USDT = "USDT"

export const UNISWAP_V2_GRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2"

export const makeConfig = (): Config => {
  return {
    endpoint: UNISWAP_V2_GRAPH_ENDPOINT
  }
}
