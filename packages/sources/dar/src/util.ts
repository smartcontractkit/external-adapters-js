import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { axiosRequest } from '@chainlink/external-adapter-framework/transports/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { customSettings } from './config'
import { AuthResponse } from './types'

const logger = makeLogger('DarUtil')

export const getAuthToken = async (
  config: AdapterConfig<typeof customSettings>,
): Promise<string> => {
  try {
    const buf = Buffer.from(`${config.WS_API_USERNAME}:${config.WS_API_KEY}`)
    const auth = buf.toString('base64')
    const jwtRes = await axiosRequest<never, AuthResponse, typeof customSettings>(
      {
        url: `${config.API_ENDPOINT}/token-auth`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
      },
      config,
    )

    return jwtRes.data.access_token
  } catch (e: unknown) {
    const err = e as any
    const message = `Login failed ${err.message ? `with message '${err.message}'` : ''}`
    const error = { ...err, message }
    logger.debug(message)
    throw error.response
      ? new AdapterDataProviderError(error)
      : error.request
      ? new AdapterConnectionError(error)
      : new AdapterError(error)
  }
}
