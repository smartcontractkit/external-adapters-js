import { makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import axios from 'axios'
import { config } from '../config'

const logger = makeLogger('GalaxyUtil')

export interface AccessTokenResponse {
  token?: string
  message?: string
}

export interface AccessToken {
  token: string
  created: number
}

export const getAccessToken = async (settings: typeof config.settings): Promise<AccessToken> => {
  const requestedTs = Date.now()
  try {
    const tokenResponse = await axios.request<AccessTokenResponse>({
      url: settings.API_ENDPOINT,
      method: 'GET',
      headers: {
        'X-GALAXY-APIKEY': settings.WS_API_KEY,
        'X-GALAXY-PASSWORD': settings.WS_API_PASSWORD,
      },
    })

    if (!tokenResponse.data.token)
      throw new AdapterDataProviderError(
        { message: tokenResponse.data.message || 'Login failed' },
        {
          providerDataRequestedUnixMs: requestedTs,
          providerIndicatedTimeUnixMs: undefined,
          providerDataReceivedUnixMs: Date.now(),
        },
      )
    return {
      token: tokenResponse.data.token,
      created: new Date().getTime(),
    }
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
