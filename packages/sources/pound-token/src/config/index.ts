import { Logger, Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BootstrapConfig } from '@chainlink/ea-bootstrap'
import { SigningAlgorithm } from '../types'

export const NAME = 'POUND_TOKEN'
export const DEFAULT_BASE_URL = 'https://olbsandbox.bankfrick.li/webapi/v2'
export const DEFAULT_ENDPOINT = 'accounts'
export const DEFAULT_PAGESIZE = 500
export const PAGE_SIZE_MAX = 500
export const PAGE_SIZE_MIN = 1
export const DEFAULT_SIGNING_ALGORITHM: SigningAlgorithm = 'rsa-sha512'

export type Config = BootstrapConfig & {
  pageSize: number
  privateKey: string
  password: string
  signingAlgorithm: SigningAlgorithm
  token: string
}

//Global variable to keep the token. Token is provisioned when the accounts endpoint is hit.
let token: string
export const setToken = (newToken: string) => (token = newToken)

export const makeConfig = (prefix?: string): Config => {
  const baseConfig = Requester.getDefaultConfig(prefix)
  const pageSizeString = util.getEnv('PAGE_SIZE')

  //Get pageSize environment variable and massage it
  let pageSize = 0
  if (pageSizeString) {
    const parsed = parseInt(pageSizeString)
    if (isNaN(parsed)) {
      Logger.warn(
        `Received NaN for PAGE_SIZE environment variable (${pageSizeString}. Using default instead: ${DEFAULT_PAGESIZE}`,
      )
      pageSize = DEFAULT_PAGESIZE
    } else {
      if (parsed > PAGE_SIZE_MAX || parsed < PAGE_SIZE_MIN) {
        Logger.warn(
          `Received a PAGE_SIZE environment variable that was > max (${PAGE_SIZE_MAX}) or < min (${PAGE_SIZE_MIN}). Using default instead ${DEFAULT_PAGESIZE}`,
        )
        pageSize = DEFAULT_PAGESIZE
      } else {
        Logger.debug(`Received ${parsed} for PAGE_SIZE`)
        pageSize = parsed
      }
    }
  }

  return {
    ...baseConfig,
    api: {
      ...baseConfig.api,
      baseURL: baseConfig.api.baseURL || DEFAULT_BASE_URL,
    },
    signingAlgorithm:
      (util.getEnv('SIGNING_ALGORITHM') as SigningAlgorithm) || DEFAULT_SIGNING_ALGORITHM,
    defaultEndpoint: DEFAULT_ENDPOINT,
    token,
    pageSize,
    apiKey: util.getRequiredEnv('API_KEY', prefix),
    privateKey: util.getRequiredEnv('PRIVATE_KEY', prefix), //Combined with the password, used to create jwt
    password: util.getRequiredEnv('PASSWORD', prefix), //Combined with private key, used to create jwt
  }
}
