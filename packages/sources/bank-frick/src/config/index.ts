import { Logger, Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BootstrapConfig } from '@chainlink/ea-bootstrap'
import { SigningAlgorithm } from '../types'
import crypto from 'crypto'

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
    } else {
      if (parsed > PAGE_SIZE_MAX || parsed < PAGE_SIZE_MIN) {
        Logger.warn(
          `Received a PAGE_SIZE environment variable that was > max (${PAGE_SIZE_MAX}) or < min (${PAGE_SIZE_MIN}). Using default instead ${DEFAULT_PAGESIZE}`,
        )
      } else {
        Logger.debug(`Received ${parsed} for PAGE_SIZE`)
        pageSize = parsed
      }
    }
  }

  let privateKey = util.getRequiredEnv('PRIVATE_KEY')
  // Some internal creds have 'BEGIN PRIVATE KEY', but all production creds use 'BEGIN RSA PRIVATE KEY'. This captures both.
  if (!privateKey.match(/-----?BEGIN ([A-Z ])*PRIVATE KEY-----?/)) {
    Logger.info(
      "Could not find 'BEGIN PRIVATE KEY' in PRIVATE_KEY envvar. Assuming it's a base64 encoded string",
    )
    privateKey = Buffer.from(privateKey, 'base64').toString('utf8')
  }
  // Attempt to sign a message using any of the supported SigningAlgorithm
  let successfulSigning = false
  const algorithms: SigningAlgorithm[] = ['rsa-sha512', 'rsa-sha384', 'rsa-sha256']

  for (const algo of algorithms) {
    try {
      Logger.debug('Attempting to sign a message with the following algorithm: ', algo)
      crypto.sign(algo, Buffer.from('test'), privateKey)
      successfulSigning = true
      Logger.debug(`Successfully signed a test message with SigningAlgorithm ${algo}`)
      break
    } catch (e) {
      Logger.debug(`Failed to sign with algorithm ${algo}`)
    }
  }

  if (!successfulSigning) {
    throw new Error(`Could not sign a message with the provided PRIVATE_KEY using any of the following algorithms: ${algorithms}
      The PRIVATE_KEY config item must be either a string containing the full private key (including newlines
      and the BEGIN/END PRIVATE KEY lines), or a base64 encoded string that can be decoded into the full private key`)
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
    apiKey: util.getRequiredEnv('API_KEY', prefix),
    privateKey, //Combined with the password, used to create jwt
  }
}
