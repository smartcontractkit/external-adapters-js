import { Execute } from '@chainlink/types'
import * as GenesisVolatility from '@chainlink/genesis-volatility-adapter'
import * as XBTO from '@chainlink/xbto-adapter'

export enum SourceDataProvider {
  XBTO = 'xbto',
  GenesisVolatility = 'genesisvolatility',
}

const isSourceDataProvider = (envVar?: string): envVar is SourceDataProvider =>
  Object.values(SourceDataProvider).includes(envVar as any)

export const getSourceDataProviders = (): SourceDataProvider[] => {
  const sourceDataProviders = (process.env.SOURCE_ADAPTERS || '').split(',')
  const adapters: SourceDataProvider[] = []

  sourceDataProviders.forEach((provider) => {
    if (isSourceDataProvider(provider)) adapters.push(provider as SourceDataProvider)
  })

  return adapters
}

export const getSourceImpl = (types: SourceDataProvider[]): Execute[] => {
  const adapters: Execute[] = []

  types.forEach((type) => {
    const prefix = type?.toUpperCase()
    switch (type) {
      case SourceDataProvider.XBTO:
        adapters.push((data) => {
          const config = XBTO.getConfig(prefix)
          return XBTO.execute(data, config)
        })
        return
      case SourceDataProvider.GenesisVolatility:
        adapters.push((data) => {
          const config = GenesisVolatility.getConfig(prefix)
          return GenesisVolatility.execute(data, config)
        })
        return
      default:
        throw Error(`Unknown source data provider adapter type: ${type}`)
    }
  })

  return adapters
}
