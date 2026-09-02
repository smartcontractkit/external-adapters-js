import { marketStatusEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

import type { StaticSourceName } from './static'

export const ADAPTER_NAMES = [
  'NCFX',
  'TRADINGHOURS',
  'FINNHUB_SECONDARY',
  'SIX',
  'STATIC_MARKET_HOURS',
] as const
export type AdapterName = (typeof ADAPTER_NAMES)[number]

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
    primary: 'SIX',
    secondary: 'TRADINGHOURS',
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
    secondary: 'STATIC_TWSE',
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
    secondary: 'STATIC_SZSE',
  },
  hkex: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_HKEX',
  },
  ice_europe_energy: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_ICE_EUROPE_ENERGY',
  },
  bme: {
    primary: 'SIX',
    secondary: 'TRADINGHOURS',
  },
  cme_trsy: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  cbot_ag: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  cme_cattle: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  cme_equity_index: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  comex_gold: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  comex_silver: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  comex_copper: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_brent: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_hhng: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_plt: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_pld: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_gasoil: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_coffee: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_sugar: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
  },
  nymex_cocoa: {
    primary: 'TRADINGHOURS',
    secondary: 'STATIC_MARKET_HOURS',
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
