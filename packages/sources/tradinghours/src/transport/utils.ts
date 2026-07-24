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
} as const

export const markets = Object.keys(marketToFinId)

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
