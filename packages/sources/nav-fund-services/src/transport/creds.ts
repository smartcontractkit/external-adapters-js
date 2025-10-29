import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const getApiKeys = (globalFundID: number) => {
  const apiKeyName = `API_KEY_${globalFundID}`
  const secretKeyName = `SECRET_KEY_${globalFundID}`

  const apiKey = process.env[apiKeyName]
  const secretKey = process.env[secretKeyName]

  if (!apiKey || !secretKey) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing '${apiKeyName}' or '${secretKeyName}' environment variables.`,
    })
  }

  return [apiKey, secretKey]
}
