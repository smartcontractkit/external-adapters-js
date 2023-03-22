import { makeLogger } from '@chainlink/external-adapter-framework/util'
import axios, { AxiosRequestConfig } from 'axios'
import crypto from 'crypto'
import { config } from './config'
import { SigningAlgorithm } from './types'

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
