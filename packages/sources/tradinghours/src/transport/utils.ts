import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import type { BaseEndpointTypes } from '../endpoint/market-status'

type MarketType = TypeFromDefinition<BaseEndpointTypes['Parameters']>['type']
export type Market = keyof typeof marketToFinId

const marketToFinId = {
  forex: 'US.CHNLNK.FX',
  metals: 'US.CHNLNK.METAL',
  wti: 'US.CHNLNK.WTI',
  nyse: 'US.NYSE',
  lse: 'GB.LSE',
  xetra: 'DE.XETR',
  tradegate: 'DE.TGAT',
  six: 'CH.SIX',
  euronext_milan: 'IT.EURONEXT',
  euronext_paris: 'FR.EURONEXT',
  tpex: 'TW.TPEX', // Taipei Exchange
  twse: 'TW.TWSE', // Taiwan Stock Exchange
  krx: 'KR.KRX', // Korea Exchange
  jpx: 'JP.JPX', // Japan Exchange Group
  sse: 'CN.SSE', // Shanghai Stock Exchange
  szse: 'CN.SZSE', // Shenzhen Stock Exchange
  nymex: 'US.CHNLNK.WTI',
  ice_europe_energy: 'US.ICE.ENERGY.GROUP3',
  bme: 'ES.BME',
  cbot_ag: 'US.CBOT.AGRI.GRAINS.FTR',
  cme_cattle: 'US.CME.AGRI.CATTLE',
  cme_equity_index: 'US.CME.EQUITY.USINDEX1',
  cme_trsy: 'US.CME.INTEREST.ALL',
  comex_copper: 'US.COMEX.METALS.COPPER',
  comex_gold: 'US.COMEX.METALS.PRECIOUS.GOLD',
  comex_silver: 'US.COMEX.METALS.PRECIOUS.SILVER',
  nymex_brent: 'US.NYMEX.ENERGY.CRUDEOIL1',
  nymex_cocoa: 'US.NYMEX.AGRI.COCOA',
  nymex_coffee: 'US.NYMEX.AGRI.COFFEE',
  nymex_gasoil: 'US.NYMEX.ENERGY.REFINEDPRODUCTS1',
  nymex_hhng: 'US.NYMEX.ENERGY.NATURALGAS1',
  nymex_pld: 'US.NYMEX.METALS.PALLADIUM.FTR',
  nymex_plt: 'US.NYMEX.METALS.PLATINUM.FTR',
  nymex_sugar: 'US.NYMEX.AGRI.SUGAR11',
} as const

export const markets = Object.keys(marketToFinId) as readonly Market[]

const market245ToFinId: Partial<Record<Market, string>> = {
  nyse: 'US.CHNLNK.NYSE',
}

export const getFinId = (market: Market, type: MarketType) => {
  if (type === '24/5' && market245ToFinId[market]) {
    return market245ToFinId[market]
  }
  return marketToFinId[market]
}

export const isMarket = (v: string): v is Market =>
  Object.prototype.hasOwnProperty.call(marketToFinId, v)
