import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/balance'

export const getApiKeys = (apiKey: string, config: BaseEndpointTypes['Settings']) => {
  if (apiKey) {
    const keyName = `${apiKey}_API_KEY`
    const key = process.env[keyName]
    if (!key) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${keyName}' environment variable.`,
      })
    }
    return key
  } else {
    return config.API_KEY
  }
}
