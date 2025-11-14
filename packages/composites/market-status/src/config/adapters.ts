import { marketStatusEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

const adapterNames = ['NCFX', 'TRADINGHOURS', 'FINNHUB_SECONDARY'] as const

export type AdapterName = (typeof adapterNames)[number]

// Mapping from market to primary and secondary adapters.
const marketAdapters: Record<string, { primary: AdapterName; secondary: AdapterName }> = {
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
}

export const getMarketAdapters = (
  type: TypeFromDefinition<typeof marketStatusEndpointInputParametersDefinition>['type'],
  market: string,
) => {
  switch (type) {
    case 'regular': {
      return marketAdapters[market] ?? marketAdapters.__default
    }
    case '24/5':
      return {
        primary: 'TRADINGHOURS',
        secondary: 'FINNHUB_SECONDARY',
      } as const
  }
}
