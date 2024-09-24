import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const getApiInfo = (apiKeyName: string) => {
  const apiKeyEnvName = `${apiKeyName}_API_KEY`.toUpperCase()

  const apiKey = process.env[apiKeyEnvName]

  if (!apiKey) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing '${apiKeyEnvName}' environment variable.`,
    })
  }

  return apiKey
}
