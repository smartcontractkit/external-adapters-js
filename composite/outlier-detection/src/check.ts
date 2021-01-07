import { Execute } from '@chainlink/types'
import * as OilpriceAPI from '@chainlink/oilpriceapi-adapter'
import * as Derbit from '@chainlink/derbit-adapter'

export enum CheckDataProvider {
  OilpriceAPI = 'oilpriceapi',
  Derbit = 'derbit',
}

const isCheckDataProvider = (envVar?: string): envVar is CheckDataProvider =>
  Object.values(CheckDataProvider).includes(envVar as any)

export const getCheckDataProviders = (): CheckDataProvider[] => {
  const sourceDataProviders = (process.env.CHECK_ADAPTERS || '').split(',')
  const adapters: CheckDataProvider[] = []

  sourceDataProviders.forEach((provider) => {
    if (isCheckDataProvider(provider)) adapters.push(provider as CheckDataProvider)
  })

  return adapters
}

export const getCheckImpl = (types: CheckDataProvider[]): Execute[] => {
  const adapters: Execute[] = []

  types.forEach((type) => {
    const prefix = type?.toUpperCase()
    switch (type) {
      case CheckDataProvider.OilpriceAPI:
        adapters.push((data) => {
          const config = OilpriceAPI.getConfig(prefix)
          return OilpriceAPI.execute(data, config)
        })
        return
      case CheckDataProvider.Derbit:
        adapters.push((data) => Derbit.execute(data))
        return
      default:
        throw Error(`Unknown source data provider adapter type: ${type}`)
    }
  })

  return adapters
}
