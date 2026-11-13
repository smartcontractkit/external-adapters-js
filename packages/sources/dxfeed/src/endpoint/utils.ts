import type { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import type { config } from '../config'

export const wsEnvPresenceError = (
  settings: Pick<typeof config.settings, 'WS_API_ENDPOINT' | 'API_USERNAME' | 'API_PASSWORD'>,
): AdapterError | undefined => {
  if (!settings.WS_API_ENDPOINT) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_ENDPOINT is not set',
    })
  }
  if (!settings.API_USERNAME || !settings.API_PASSWORD) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'API_USERNAME and API_PASSWORD are required for the ws transport',
    })
  }
  return
}
