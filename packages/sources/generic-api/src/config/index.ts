import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const config = new AdapterConfig({})

const getEnvVar = (prefix: string, name: string): string => {
  const envVarName = `${prefix}_${name}`
  if (!(envVarName in process.env)) {
    throw new AdapterInputError({
      message: `Missing required environment variable '${envVarName}'.`,
      statusCode: 400,
    })
  }
  return process.env[envVarName] as string
}

export const getApiConfig = (apiName: string) => {
  const envVarPrefix = apiName.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')
  return {
    url: getEnvVar(envVarPrefix, 'API_URL'),
    authHeader: getEnvVar(envVarPrefix, 'AUTH_HEADER'),
    authHeaderValue: getEnvVar(envVarPrefix, 'AUTH_HEADER_VALUE'),
  }
}
