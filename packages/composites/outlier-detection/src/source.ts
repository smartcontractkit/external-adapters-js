import { AdapterImplementation } from '@chainlink/types'
// source adapters
import GenesisVolatility from '@chainlink/genesis-volatility-adapter'
import XBTO from '@chainlink/xbto-adapter'
import dxFeed from '@chainlink/dxfeed-adapter'

export const adapters: AdapterImplementation[] = [GenesisVolatility, XBTO, dxFeed]

export type Source = typeof adapters[number]['NAME']
