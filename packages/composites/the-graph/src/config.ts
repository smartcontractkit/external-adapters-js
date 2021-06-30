import { Config as DefaultConfig } from "@chainlink/types"
import { DexSubgraph } from "./types"
import { uniswapSubgraph } from "./methods/prices/dex"

export type Config = DefaultConfig & {
  infuraHost: string,
  dexSubgraphs: {
    [T: string]: DexSubgraph
  }
}

export const INFURA_HOST = process.env.INFURA_HOST || ""
export const USDT_USD_AGGREGATOR_V3_ADDRESS = process.env.AGGREGATOR_V3_ADDRESS || "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D"

export const PRICE = "price"

export const USD = "USD"
export const ETH = "ETH"
export const WETH = "WETH"
export const USDT = "USDT"

export const UNISWAP = "UNISWAP"

export const makeConfig = (): Config => {
  return {
    infuraHost: INFURA_HOST,
    dexSubgraphs: {
      [UNISWAP]: uniswapSubgraph.subgraph
    }
  }
}
