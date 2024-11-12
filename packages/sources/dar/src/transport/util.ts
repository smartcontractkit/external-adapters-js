import { makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import axios from 'axios'
import { config } from '../config'

const logger = makeLogger('DarUtil')

export interface AuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export const getAuthToken = async (settings: typeof config.settings): Promise<string> => {
  const requestedTs = Date.now()
  try {
    const buf = Buffer.from(`${settings.WS_API_USERNAME}:${settings.WS_API_KEY}`)
    const auth = buf.toString('base64')
    const jwtRes = await axios.request<AuthResponse>({
      url: `${settings.API_ENDPOINT}/token-auth`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
    })

    return jwtRes.data.access_token
  } catch (e: unknown) {
    const err = e as any
    const message = `Login failed ${err.message ? `with message '${err.message}'` : ''}`
    const error = { ...err, message }

    logger.debug(message)

    throw error.response
      ? new AdapterDataProviderError(error, {
          providerDataRequestedUnixMs: requestedTs,
          providerIndicatedTimeUnixMs: undefined,
          providerDataReceivedUnixMs: Date.now(),
        })
      : error.request
      ? new AdapterConnectionError(error, {
          providerDataRequestedUnixMs: requestedTs,
          providerIndicatedTimeUnixMs: undefined,
          providerDataReceivedUnixMs: Date.now(),
        })
      : new AdapterError(error)
  }
}
