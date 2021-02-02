import { Execute } from '@chainlink/types'
import * as OilpriceAPI from '@chainlink/oilpriceapi-adapter'
import * as Deribit from '@chainlink/deribit-adapter'
import * as dxFeed from '@chainlink/dxfeed-adapter'
import { util } from '@chainlink/ea-bootstrap'

export enum CheckDataProvider {
  OilpriceAPI = 'oilpriceapi',
  Deribit = 'deribit',
  dxFeed = 'dxfeed',
}

export const ENV_CHECK_ADAPTERS = 'CHECK_ADAPTERS'

const isCheckDataProvider = (envVar?: string): envVar is CheckDataProvider =>
  Object.values(CheckDataProvider).includes(envVar as any)

export const getCheckDataProviders = (prefix = ''): CheckDataProvider[] => {
  const checkDataProviders = (util.getEnv(ENV_CHECK_ADAPTERS, prefix) || '').split(',') as string[]
  return checkDataProviders
    .filter(isCheckDataProvider)
    .map((provider) => provider as CheckDataProvider)
}

export const getCheckImpl = (type: CheckDataProvider): Execute => {
  const prefix = type?.toUpperCase()
  switch (type) {
    case CheckDataProvider.OilpriceAPI:
      return OilpriceAPI.makeExecute(OilpriceAPI.makeConfig(prefix))
    case CheckDataProvider.Deribit:
      return Deribit.makeExecute(Deribit.makeConfig(prefix))
    case CheckDataProvider.dxFeed:
      return dxFeed.makeExecute(dxFeed.makeConfig(prefix))
    default:
      throw Error(`Unknown source data provider adapter type: ${type}`)
  }
}
