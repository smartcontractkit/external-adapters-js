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
  return sourceDataProviders.filter(isSourceDataProvider)
    .map(provider => provider as SourceDataProvider)
}

export const getSourceImpl = (type: SourceDataProvider): Execute => {
  const adapters: Execute[] = []

  types.forEach((type) => {
    const prefix = type?.toUpperCase()
    switch (type) {
      case SourceDataProvider.XBTO:
        const config = XBTO.makeConfig(prefix)
        adapters.push(XBTO.makeExecute(config))
        return
      case SourceDataProvider.GenesisVolatility:
        const config = GenesisVolatility.makeConfig(prefix)
        adapters.push(GenesisVolatility.makeExecute(config))
        return
      default:
        throw Error(`Unknown source data provider adapter type: ${type}`)
    }
  })

  return adapters
}
