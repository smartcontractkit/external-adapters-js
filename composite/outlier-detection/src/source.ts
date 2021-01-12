import { Execute } from '@chainlink/types'
import * as GenesisVolatility from '@chainlink/genesis-volatility-adapter'
import * as XBTO from '@chainlink/xbto-adapter'
import { util } from '@chainlink/ea-bootstrap'

export enum SourceDataProvider {
  XBTO = 'xbto',
  GenesisVolatility = 'genesisvolatility',
}

export const ENV_SOURCE_ADAPTERS = 'SOURCE_ADAPTERS'

const isSourceDataProvider = (envVar?: string): envVar is SourceDataProvider =>
  Object.values(SourceDataProvider).includes(envVar as any)

export const getSourceDataProviders = (prefix = ''): SourceDataProvider[] => {
  const sourceDataProviders = (util.getEnv(ENV_SOURCE_ADAPTERS, prefix) || '').split(
    ',',
  ) as string[]
  return sourceDataProviders
    .filter(isSourceDataProvider)
    .map((provider) => provider as SourceDataProvider)
}

export const getSourceImpl = (type: SourceDataProvider): Execute => {
  const prefix = type?.toUpperCase()
  switch (type) {
    case SourceDataProvider.XBTO:
      return XBTO.makeExecute(XBTO.makeConfig(prefix))
    case SourceDataProvider.GenesisVolatility:
      return GenesisVolatility.makeExecute(GenesisVolatility.makeConfig(prefix))
    default:
      throw Error(`Unknown source data provider adapter type: ${type}`)
  }
}
