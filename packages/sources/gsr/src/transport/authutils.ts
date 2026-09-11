import { makeLogger } from '@chainlink/external-adapter-framework/util'
import axios from 'axios'
import crypto from 'crypto'

const logger = makeLogger('GSR Auth Token Utils')

interface TokenError {
  success: false
  ts: number
  error: string
}

interface TokenSuccess {
  success: true
  ts: number
  token: string
  validUntil: string
}

type AccessTokenResponse = TokenError | TokenSuccess

export interface TokenWithExpiry {
  token: string
  expiresAtMs: number
}

const currentTimeNanoSeconds = (): number => new Date(Date.now()).getTime() * 1_000_000

// GSR signs over the API key when minting a token and over the existing token
// when renewing one.
const generateSignature = (privateKey: string, payload: string) =>
  crypto.createHmac('sha256', privateKey).update(payload).digest('hex')

// restApiEndpoint is used for token auth
export const getToken = async (
  restApiEndpoint: string,
  userId: string,
  publicKey: string,
  privateKey: string,
): Promise<TokenWithExpiry> => {
  logger.debug('Fetching new access token')

  const ts = currentTimeNanoSeconds()
  const signature = generateSignature(privateKey, `userId=${userId}&apiKey=${publicKey}&ts=${ts}`)
  const response = await axios.post<AccessTokenResponse>(`${restApiEndpoint}/token`, {
    apiKey: publicKey,
    userId,
    ts,
    signature,
  })

  if (!response.data.success) {
    logger.error(`Unable to get access token: ${response.data.error}`)

    if (response.data.error === 'Server Error') {
      logger.error(`There is something wrong with token request.
        Possible Solution:
        1. Instance timestamp drift may cause your ts to be off from expected resulting in the signature being rejected.
        2. Doublecheck your supplied credentials.
        3. Contact Data Provider to ensure your subscription is active
        4. If credentials are supplied under the node licensing agreement with Chainlink Labs, please contact us.`)
    } else if (
      ['Signature mismatch', 'UserID not found', 'API key mismatch'].includes(response.data.error)
    ) {
      logger.error(`There is something wrong with token request.
        Possible Solution:
        1. Doublecheck your supplied credentials.
        2. Ensure creds are encoded correctly
        3. Contact Data Provider to ensure your subscription is active
        4. If credentials are supplied under the node licensing agreement with Chainlink Labs, please contact us.`)
    }

    throw new Error(response.data.error)
  }

  const expiresAtMs = new Date(response.data.validUntil).getTime()
  logger.info(`Token obtained, expires at ${response.data.validUntil}`)

  return {
    token: response.data.token,
    expiresAtMs,
  }
}

/**
 * Renews an existing token via GSR's PUT endpoint rather than minting a fresh
 * one. This is the provider's documented renewal path; the adapter used it
 * until #2459 removed it in Jan 2023.
 *
 * Note this renews the *token*, which is a separate thing from the WebSocket
 * session. The token travels in the connection's handshake headers, so whether
 * a renewal extends an already-open connection is GSR-side behaviour the caller
 * must verify rather than assume.
 */
export const renewToken = async (
  restApiEndpoint: string,
  userId: string,
  privateKey: string,
  existingToken: string,
): Promise<TokenWithExpiry> => {
  logger.debug('Renewing existing access token')

  const ts = currentTimeNanoSeconds()
  const signature = generateSignature(
    privateKey,
    `userId=${userId}&token=${existingToken}&ts=${ts}`,
  )
  const response = await axios.put<AccessTokenResponse>(`${restApiEndpoint}/token`, {
    token: existingToken,
    userId,
    ts,
    signature,
  })

  if (!response.data.success) {
    logger.warn(`Unable to renew access token: ${response.data.error}`)
    throw new Error(response.data.error)
  }

  const expiresAtMs = new Date(response.data.validUntil).getTime()
  logger.info(`Token renewed, expires at ${response.data.validUntil}`)

  return {
    token: response.data.token,
    expiresAtMs,
  }
}
