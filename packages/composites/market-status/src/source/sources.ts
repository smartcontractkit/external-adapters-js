import { marketStatusEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

import type { StaticSourceName } from './static'

export type AdapterName = 'NCFX' | 'TRADINGHOURS' | 'FINNHUB_SECONDARY'

export type SourceName = AdapterName | StaticSourceName

// Mapping from market to primary and secondary sources.
const marketSources: Record<string, { primary: SourceName; secondary: SourceName }> = {
  __default: {
    primary: 'TRADINGHOURS',
    secondary: 'NCFX',
  },
  forex: {
    primary: 'NCFX',
    secondary: 'TRADINGHOURS',
  },
  metals: {
    primary: 'NCFX',
    secondary: 'TRADINGHOURS',
  },
  nyse: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  lse: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  xetra: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  six: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  euronext_milan: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  euronext_paris: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  nymex: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_NYMEX',
  },
  tpex: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_TPEX',
  },
  twse: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_TPEX',
  },
  krx: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_KRX',
  },
  jpx: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_JPX',
  },
  sse: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_SSE',
  },
  szse: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_SSE',
  },
}

export const getMarketSources = (
  type: TypeFromDefinition<typeof marketStatusEndpointInputParametersDefinition>['type'],
  market: string,
): { primary: SourceName; secondary: SourceName } => {
  switch (type) {
    case 'regular': {
      return marketSources[market] ?? marketSources.__default
    }
    case '24/5':
      return {
        primary: 'TRADINGHOURS',
        secondary: 'STATIC_NYSE_245',
      } as const
  }
}
