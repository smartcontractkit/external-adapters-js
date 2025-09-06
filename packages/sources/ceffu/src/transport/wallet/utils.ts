import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const getApiKeys = (client: string) => {
  const proxyKeyName = `WALLET_${client.toUpperCase()}_API_PROXY`
  const apiKeyName = `WALLET_${client.toUpperCase()}_API_KEY`
  const privateKeyName = `WALLET_${client.toUpperCase()}_PRIVATE_KEY`

  const proxy = process.env[proxyKeyName]
  const apiKey = process.env[apiKeyName]
  const privateKey = process.env[privateKeyName]

  if (!apiKey || !privateKey) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing '${apiKeyName}' or '${privateKeyName}' environment variables.`,
    })
  }

  return [proxy || '', apiKey, privateKey]
}
