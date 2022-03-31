import { Config as DefaultConfig } from '@chainlink/types'
import { DexSubgraph } from '../types'
import { uniswapSubgraph } from '../endpoint/prices/dex'
import { Requester, util } from '@chainlink/ea-bootstrap'

export const NAME = 'THE_GRAPH'
export const DEFAULT_ENDPOINT = 'prices'

export type Config = DefaultConfig & {
  dexSubgraphs: {
    [T: string]: DexSubgraph
  }
}

export const DEFAULT_NETWORK = 'ETHEREUM'

export const WETH = 'WETH'
export const UNISWAP = 'UNISWAP'
const DEFAULT_UNISWAP_V2_SUBGRAPH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2'

export const makeConfig = (prefix?: string): Config => {
  const uniswapV2SubgraphEndpoint =
    util.getEnv('UNISWAP_V2_SUBGRAPH_ENDPOINT', prefix) || DEFAULT_UNISWAP_V2_SUBGRAPH_ENDPOINT
  return {
    ...Requester.getDefaultConfig(prefix),
    dexSubgraphs: {
      [UNISWAP]: new uniswapSubgraph.UniswapSubgraph(uniswapV2SubgraphEndpoint),
    },
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
