import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const config = new AdapterConfig({})

const sanitizeEnvVarName = (name: string): string => {
  return name.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')
}

const getEnvVar = (prefix: string, name: string): string => {
  const envVarName = sanitizeEnvVarName(`${prefix}_${name}`)
  if (!(envVarName in process.env)) {
    throw new AdapterInputError({
      message: `Missing required environment variable '${envVarName}'.`,
      statusCode: 400,
    })
  }
  return process.env[envVarName] as string
}

export const getApiConfig = (apiName: string) => {
  return {
    url: getEnvVar(apiName, 'API_URL'),
    authHeader: getEnvVar(apiName, 'AUTH_HEADER'),
    authHeaderValue: getEnvVar(apiName, 'AUTH_HEADER_VALUE'),
  }
}
