<<<<<<< HEAD
import { util } from '@chainlink/ea-bootstrap'
import { Execute } from '@chainlink/types'
import { getSourceDataProviders, getSourceImpl } from './source'
import { getCheckDataProviders, getCheckImpl } from './check'

export type Config = {
  sourceAdapters: Execute[]
  checkAdapters: Execute[]
  threshold: {
    checks: number
    onchain: number
  }
}

export const ENV_CHECK_THRESHOLD = 'CHECK_THRESHOLD'
export const ENV_ONCHAIN_THRESHOLD = 'ONCHAIN_THRESHOLD'

export const makeConfig = (prefix = ''): Config => {
  const threshold = {
    checks: Number(util.getEnv(ENV_CHECK_THRESHOLD, prefix) || 0),
    onchain: Number(util.getEnv(ENV_ONCHAIN_THRESHOLD, prefix) || 0),
  }

  const sourceDataProviders = getSourceDataProviders(prefix)
  const sourceAdapters = sourceDataProviders.map(getSourceImpl)
  if (sourceAdapters.length === 0) {
    throw Error('No source adapters provided')
  }

  const checkDataProviders = getCheckDataProviders(prefix)
  const checkAdapters = checkDataProviders.map(getCheckImpl)
  if (threshold.checks > 0 && checkAdapters.length === 0) {
    throw Error('Check threshold is >0, but no check adapters were provided')
  }

  return { sourceAdapters, checkAdapters, threshold }
=======
import { getDefaultConfig } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { getDataProvider, PriceAdapter } from './dataProvider'

export type GetPriceAdapter = (name: string) => PriceAdapter

export type Config = {
  getPriceAdapter: GetPriceAdapter
}

export const makeConfig = (prefix = ''): Config => {
  const getPriceAdapter: GetPriceAdapter = (name) => {
    const dataProviderUrl = util.getRequiredEnv('DATA_PROVIDER_URL', name.toUpperCase())
    const defaultConfig = getDefaultConfig(prefix)
    defaultConfig.api.baseURL = dataProviderUrl
    defaultConfig.api.method = 'post'
    return getDataProvider(defaultConfig.api)
  }

  return { getPriceAdapter }
>>>>>>> 8f063916... MarketClosure data reliance (#344)
}
