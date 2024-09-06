import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/wallet'

export const getApiInfo = (reserve: string, config: BaseEndpointTypes['Settings']) => {
  const apiKeyName = `${reserve}_API_KEY`
  const apiEndpointName = `${reserve}_API_ENDPOINT`

  const apiKey = process.env[apiKeyName]
  const apiEndpoint = process.env[apiEndpointName]

  if (!apiKey || !apiEndpoint) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing '${apiKeyName}' or '${apiEndpointName}' environment variables.`,
    })
  }

  const apiLimit = parseInt(process.env[`${reserve}_API_LIMIT`] || '') || config.API_LIMIT

  return { apiKey, apiEndpoint, apiLimit }
}
