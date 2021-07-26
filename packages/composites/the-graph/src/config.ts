import { Config as DefaultConfig } from "@chainlink/types"
import { uniswapSubgraph, curveSubgraph } from "./methods/prices/dex"
import { util } from '@chainlink/ea-bootstrap'
import { CurveSubgraph } from "./methods/prices/dex/curve"
import { UniswapSubgraph } from "./methods/prices/dex/uniswap"

export type Config = DefaultConfig & {
  dexSubgraphs: {
    [T: string]: UniswapSubgraph | CurveSubgraph
  }
}

export const WETH = "WETH"
export const UNISWAP = "UNISWAP"
export const CURVE = "CURVE"

const DEFAULT_UNISWAP_V2_SUBGRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2"
const DEFAULT_CURVE_SUBGRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/curvefi/curve"

export const makeConfig = (prefix?: string): Config => {
  const uniswapV2SubgraphEndpoint = util.getEnv("UNISWAP_V2_SUBGRAPH_ENDPOINT", prefix) || DEFAULT_UNISWAP_V2_SUBGRAPH_ENDPOINT
  const curveSubgraphEndpoint = util.getEnv("CURVE_SUBGRAPH_ENDPOINT", prefix) || DEFAULT_CURVE_SUBGRAPH_ENDPOINT
  return {
    dexSubgraphs: {
      [UNISWAP]: new uniswapSubgraph.UniswapSubgraph(uniswapV2SubgraphEndpoint),
      [CURVE]: new curveSubgraph.CurveSubgraph(curveSubgraphEndpoint)
    }
  }
}
