import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { customSettings } from './config'
import { AccessToken, AccessTokenResponse } from './types'
import axios from 'axios'

const logger = makeLogger('GalaxyUtil')

export const getAccessToken = async (
  config: AdapterConfig<typeof customSettings>,
): Promise<AccessToken> => {
  const requestedTs = Date.now()
  try {
    const tokenResponse = await axios.request<AccessTokenResponse>({
      url: config.API_ENDPOINT,
      method: 'GET',
      headers: {
        'X-GALAXY-APIKEY': config.WS_API_KEY,
        'X-GALAXY-PASSWORD': config.WS_API_PASSWORD,
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
