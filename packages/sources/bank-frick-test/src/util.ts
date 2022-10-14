import crypto from 'crypto'
import { SigningAlgorithm } from './types'
import { customSettings } from './config'
import axios, { AxiosRequestConfig } from 'axios'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

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
  config: AdapterConfig<typeof customSettings>,
  signingAlgorithm: SigningAlgorithm = 'rsa-sha512',
): Promise<string> => {
  logger.info("Generating a new JWT because we don't have one in config.token")
  const { API_KEY, PRIVATE_KEY, API_ENDPOINT } = config

  // All of these are required, so validation should have failed prior to this line
  if (!API_KEY || !PRIVATE_KEY) {
    throw new Error(
      'API_KEY, PRIVATE_KEY, and PASSWORD all must be defined to get a new token\n' +
        'Received:  \n' +
        `API_KEY: ${API_KEY}\n` +
        `PRIVATE_KEY: ${PRIVATE_KEY}`,
    )
  }

  const data: TokenRequestBody = {
    key: API_KEY,
  }

  const signature = crypto.sign(signingAlgorithm, Buffer.from(JSON.stringify(data)), PRIVATE_KEY)
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
