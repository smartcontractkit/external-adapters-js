import { Config as DefaultConfig } from "@chainlink/types"
import { DexSubgraph } from "./types"
import { uniswapSubgraph } from "./methods/prices/dex"
import { util } from '@chainlink/ea-bootstrap'

export type Config = DefaultConfig & {
  dexSubgraphs: {
    [T: string]: DexSubgraph
  }
}

export const WETH = "WETH"
export const UNISWAP = "UNISWAP"
const UNISWAP_V2_SUBGRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2"

export const makeConfig = (): Config => {
  const uniswapV2SubgraphEndpoint = util.getEnv("UNISWAP_V2_SUBGRAPH_ENDPOINT") || UNISWAP_V2_SUBGRAPH_ENDPOINT
  return {
    dexSubgraphs: {
      [UNISWAP]: new uniswapSubgraph.UniswapSubgraph(uniswapV2SubgraphEndpoint)
    }
  }
}
