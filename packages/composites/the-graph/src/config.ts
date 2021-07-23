import { Config as DefaultConfig } from "@chainlink/types"
import { DexCurveSubgraph, DexUniswapSubgraph } from "./types"
import { uniswapSubgraph, curveSubgraph } from "./methods/prices/dex"
import { util } from '@chainlink/ea-bootstrap'

export type Config = DefaultConfig & {
  dexSubgraphs: {
    [T: string]: DexUniswapSubgraph | DexCurveSubgraph
  }
}

export const WETH = "WETH"
export const UNISWAP = "UNISWAP"
export const CURVE = "CURVE"
export const DEFAULT_ORACLE_ADDRESS = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"

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
