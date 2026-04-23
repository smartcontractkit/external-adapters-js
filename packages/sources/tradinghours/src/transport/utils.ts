import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import type { BaseEndpointTypes } from '../endpoint/market-status'

type MarketType = TypeFromDefinition<BaseEndpointTypes['Parameters']>['type']
export type Market = (typeof markets)[number]

export const markets = [
  'forex',
  'metals',
  'wti',
  'nyse',
  'lse',
  'xetra',
  'tradegate',
  'six',
  'euronext_milan',
  'euronext_paris',
  'tpex', // Taipei Exchange
  'twse', // Taiwan Stock Exchange
  'krx', // Korea Exchange
  'jpx', // Japan Exchange Group
  'sse', // Shanghai Stock Exchange
  'szse', // Shenzhen Stock Exchange
  'nymex',
  'ice_europe_energy',
] as const

const marketToFinId: Record<Market, string> = {
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
  tpex: 'TW.TPEX',
  twse: 'TW.TWSE',
  krx: 'KR.KRX',
  jpx: 'JP.JPX',
  sse: 'CN.SSE',
  szse: 'CN.SZSE',
  nymex: 'US.CHNLNK.WTI',
  ice_europe_energy: 'US.ICE.ENERGY.GROUP3',
}

const market245ToFinId: Partial<Record<Market, string>> = {
  nyse: 'US.CHNLNK.NYSE',
}

export const getFinId = (market: Market, type: MarketType) => {
  if (type === '24/5' && market245ToFinId[market]) {
    return market245ToFinId[market]
  }
  return marketToFinId[market]
}

export const isMarket = (v: string): v is Market => markets.includes(v as Market)
