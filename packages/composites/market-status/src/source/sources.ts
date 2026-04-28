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
    secondary: 'FINNHUB_SECONDARY',
  },
  twse: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  krx: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  jpx: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  sse: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
  },
  szse: {
    primary: 'TRADINGHOURS',
    secondary: 'FINNHUB_SECONDARY',
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
