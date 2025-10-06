export const adapterNames = ['NCFX', 'TRADINGHOURS', 'FINNHUB_SECONDARY'] as const

export type AdapterName = (typeof adapterNames)[number]

// Mapping from market to primary and secondary adapters.
export const marketAdapters: Record<string, { primary: AdapterName; secondary: AdapterName }> = {
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
