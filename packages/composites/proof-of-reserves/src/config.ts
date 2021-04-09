import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { adapters as ProtocolAdapters, Protocol } from './protocol'
import { adapters as BalanceAdapters, Indexer } from './balance'
import { util } from '@chainlink/ea-bootstrap'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    protocol-adapter:
 *      oneOf:
 *        - WBTC_DATA_PROVIDER_URL
 *        - RENVM_DATA_PROVIDER_URL
 *    indexer-adapter:
 *      oneOf:
 *        - AMBERDATA_DATA_PROVIDER_URL
 *        - BLOCKCHAIN_COM_DATA_PROVIDER_URL
 *        - BLOCKCYPHER_DATA_PROVIDER_URL
 *        - BLOCKCHAIR_DATA_PROVIDER_URL
 *        - BTC_COM_DATA_PROVIDER_URL
 *        - CRYPTOAPIS_DATA_PROVIDER_URL
 *        - SOCHAIN_DATA_PROVIDER_URL
 */

export const DEFAULT_CONFIRMATIONS = 6

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)

export const ENV_DATA_PROVIDER_URL = 'DATA_PROVIDER_URL'

export const getURL = (prefix: string, required = false) =>
  required
    ? util.getRequiredEnv(ENV_DATA_PROVIDER_URL, prefix)
    : util.getEnv(ENV_DATA_PROVIDER_URL, prefix)

export const makeOptions = () => {
  const options = {
    protocol: [] as Protocol[],
    indexer: [] as Indexer[],
  }
  for (const a of ProtocolAdapters) {
    const url = getURL(a.NAME)
    if (url) {
      options.protocol.push(a.NAME)
      options.protocol.push(a.NAME.toLowerCase())
    }
  }
  for (const a of BalanceAdapters) {
    const url = getURL(a.NAME)
    if (url) {
      options.indexer.push(a.NAME)
      options.indexer.push(a.NAME.toLowerCase())
    }
  }
  return options
}
