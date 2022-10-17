import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'UNIVERSAL' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.
export const DEFAULT_BASE_URL = 'http://localhost:18081'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = 'sandbox'
  const sandboxURL = process.env['SANDBOX_URL']
  const sandboxAuthPrivateKey = process.env['SANDBOX_PRIVATE_AUTH_KEY']
  if (!sandboxURL) {
    throw Error('set the URL of the FaaS sandbox using the SANDBOX_URL config variable')
  }
  if (!sandboxAuthPrivateKey) {
    throw Error(
      'set the URL of the FaaS sandbox authentication key using the SANDBOX_PRIVATE_AUTH_KEY config variable',
    )
  }
  const maxHexStringLength = parseInt(process.env['MAX_HEXSTRING_LENGTH'] ?? '130')
  const sandboxTimeout = parseInt(process.env['SANDBOX_TIMEOUT'] ?? '30000')
  config.adapterSpecificParams = {
    sandboxURL,
    sandboxAuthPrivateKey,
    maxHexStringLength,
    sandboxTimeout,
  }
  return config
}
