import { Config as DefaultConfig } from "@chainlink/types"
import { DexSubgraph } from "./types"
import { uniswapSubgraph } from "./methods/prices/dex"

export type Config = DefaultConfig & {
  dexSubgraphs: {
    [T: string]: DexSubgraph
  }
}

export const WETH = "WETH"
export const UNISWAP = "UNISWAP"

export const makeConfig = (): Config => {
  return {
    dexSubgraphs: {
      [UNISWAP]: uniswapSubgraph.subgraph
    }
  }
}
