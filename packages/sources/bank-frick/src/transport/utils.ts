import { makeLogger } from '@chainlink/external-adapter-framework/util'
import axios, { AxiosRequestConfig } from 'axios'
import crypto from 'crypto'
import { config } from '../config'

export interface Account {
  account: string // The account number of the account
  type: string // The type of the account
  iban: string // The iban of the account if exists
  customer: string // The customer data of the account which consists of the customer number and name
  currency: string // The account currency
  balance: number // The current account balance
  available: number // The available amount of the account as defined in the online banking
}
/**
 * Types representing what we send/receive from the bank frick api
 * See https://developers.bankfrick.li/docs#data-types for details
 */
export interface BankFrickAccountsResponseSchema {
  errors?: string[]
  date: Date
  moreResults: boolean
  resultSetSize: number
  accounts: Account[]
}
export interface BankFrickAccountsRequestSchema {
  firstPosition: number
  maxResults: number
}

/**
 * Types representing the input parameters and response of the adapter
 */
export interface AdapterInputParameters {
  ibanIDs: string[]
  signingAlgorithm?: SigningAlgorithm
}

/**
 * These are the options from the docs, but it's hard to see. See the first paragraph from this
 * page for details:  https://developers.bankfrick.li/docs#getting-started-signatures
 */
export type SigningAlgorithm = 'dsa-sha512' | 'rsa-sha256' | 'rsa-sha384' | 'rsa-sha512'

interface TokenResponseBody {
  errors?: string[]
  token: string
}
interface TokenRequestBody {
  key: string
}

const logger = makeLogger('BankFrickUtil')

// Used by all endpoints requiring authentication
export const generateJWT = async (
  settings: typeof config.settings,
  signingAlgorithm: SigningAlgorithm = 'rsa-sha512',
): Promise<string> => {
  logger.info("Generating a new JWT because we don't have one in config.token")
  const { API_KEY, PRIVATE_KEY, API_ENDPOINT } = settings

  // All of these are required, so validation should have failed prior to this line
  if (!API_KEY || !PRIVATE_KEY) {
    throw new Error(
      'API_KEY, PRIVATE_KEY, and PASSWORD all must be defined to get a new token\n' +
        'Received:  \n' +
        `API_KEY: ${API_KEY}\n` +
        `PRIVATE_KEY: ${PRIVATE_KEY}`,
    )
  }
  let privateKey = PRIVATE_KEY

  if (!privateKey.match(/-----?BEGIN ([A-Z ])*PRIVATE KEY-----?/)) {
    privateKey = Buffer.from(privateKey, 'base64').toString('utf8')
  }

  const data: TokenRequestBody = {
    key: API_KEY,
  }

  const signature = crypto.sign(signingAlgorithm, Buffer.from(JSON.stringify(data)), privateKey)
  const options: AxiosRequestConfig<TokenRequestBody> = {
    method: 'POST',
    baseURL: API_ENDPOINT,
    url: `authorize`,
    headers: {
      Signature: signature.toString('base64'),
      algorithm: signingAlgorithm,
    },
    data,
  }

  const response = await axios.request<TokenResponseBody>(options)

  return response.data.token
}
