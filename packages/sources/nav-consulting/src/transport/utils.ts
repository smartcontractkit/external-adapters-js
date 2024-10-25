import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const getApiKeys = (fund: string) => {
  fund = fund.toUpperCase()
  const apiKeyName = `${fund}_API_KEY`
  const secretKeyName = `${fund}_SECRET_KEY`

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
