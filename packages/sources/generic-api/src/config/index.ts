import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const config = new AdapterConfig({})

const sanitizeEnvVarName = (name: string): string => {
  return name.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')
}

const getEnvVarName = (prefix: string, name: string): string => {
  return sanitizeEnvVarName(`${prefix}_${name}`)
}

const getEnvVar = (prefix: string, name: string, required: boolean): string | undefined => {
  const envVarName = getEnvVarName(prefix, name)
  if (required && !(envVarName in process.env)) {
    throw new AdapterInputError({
      message: `Missing required environment variable '${envVarName}'.`,
      statusCode: 400,
    })
  }
  return process.env[envVarName] as string
}

export const getApiConfig = (apiName: string) => {
  const url = getEnvVar(apiName, 'API_URL', true) as string
  const authHeader = getEnvVar(apiName, 'AUTH_HEADER', false)
  const authHeaderValue = getEnvVar(apiName, 'AUTH_HEADER_VALUE', false)
  if (!!authHeader !== !!authHeaderValue) {
    const authHeadVarName = getEnvVarName(apiName, 'AUTH_HEADER')
    const authHeadValueVarName = getEnvVarName(apiName, 'AUTH_HEADER_VALUE')
    throw new AdapterInputError({
      message: `If one of ${authHeadVarName} or ${authHeadValueVarName} is set, both must be set.`,
      statusCode: 500,
    })
  }
  return {
    url,
    authHeader,
    authHeaderValue,
  }
}
