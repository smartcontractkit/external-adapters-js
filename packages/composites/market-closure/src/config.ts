import { Requester } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { getDataProvider, PriceAdapter } from './dataProvider'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    DATA_PROVIDER_URL:
 *      required: true
 *    CHECK_API_KEY:
 *      required: false
 *    (SOURCE)_DATA_PROVIDER_URL:
 *      required: true
 */

export type GetPriceAdapter = (name: string) => PriceAdapter

export type Config = {
  getPriceAdapter: GetPriceAdapter
}

export const makeConfig = (prefix = ''): Config => {
  const getPriceAdapter: GetPriceAdapter = (name) => {
    const dataProviderUrl = util.getRequiredEnv('DATA_PROVIDER_URL', name.toUpperCase())
    const defaultConfig = Requester.getDefaultConfig(prefix)
    defaultConfig.api.baseURL = dataProviderUrl
    defaultConfig.api.method = 'post'
    return getDataProvider(defaultConfig.api)
  }

  return { getPriceAdapter }
}
