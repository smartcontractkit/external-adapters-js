import { Logger, Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BootstrapConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'BANK_FRICK'
export const DEFAULT_BASE_URL = 'https://olbsandbox.bankfrick.li/webapi/v2'
export const DEFAULT_ENDPOINT = 'accounts'
export const DEFAULT_PAGESIZE = 500
export const PAGE_SIZE_MAX = 500
export const PAGE_SIZE_MIN = 1

export type Config = BootstrapConfig & {
  pageSize: number
  privateKey: string
  token: string //Set as a global variable on the first run.
  allowInsecure?: boolean //Sandbox's cert setup is difficult, so allow skipping verification in dev only.
}

//Global variable to keep the token. Token is provisioned when the accounts endpoint is hit.
let token: string
export const setToken = (newToken: string) => (token = newToken)

export const makeConfig = (prefix?: string): Config => {
  const baseConfig = Requester.getDefaultConfig(prefix)
  const pageSizeString = util.getEnv('PAGE_SIZE')

  //Get pageSize environment variable and massage it
  let pageSize = DEFAULT_PAGESIZE
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

  let allowInsecure = false
  if (process.env.ALLOW_INSECURE === 'true') {
    if (process.env.NODE_ENV !== 'development') {
      Logger.warn(
        "ALLOW_INSECURE is true, but NODE_ENV isn't set to development. Ignoring the variable and setting ALLOW_INSECURE to false",
      )
    } else {
      Logger.debug('ALLOW_INSECURE is true. Will skip certificate verification for requests')
      allowInsecure = true
    }
  }

  return {
    ...baseConfig,
    api: {
      ...baseConfig.api,
      baseURL: baseConfig.api.baseURL || DEFAULT_BASE_URL,
    },
    defaultEndpoint: DEFAULT_ENDPOINT,
    token,
    pageSize,
    allowInsecure,
    apiKey: util.getRequiredEnv('API_KEY', prefix),
    privateKey: util.getRequiredEnv('PRIVATE_KEY', prefix), //Combined with the password, used to create jwt
  }
}
