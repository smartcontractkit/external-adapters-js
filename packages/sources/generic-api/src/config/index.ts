import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const config = new AdapterConfig({
  API_NAME_API_URL: {
    description:
      'The API URL to use for a given ${API_NAME}, where ${API_NAME} is the upper-snake-case version of the apiName input parameter',
    type: 'string',
    required: true,
    variablePlaceholder: 'API_NAME',
    sensitive: true,
  },
  API_NAME_AUTH_HEADER: {
    description: 'The header to pass the authentication credentials on for ${API_NAME}',
    type: 'string',
    required: false,
    variablePlaceholder: 'API_NAME',
    sensitive: false,
  },
  API_NAME_AUTH_HEADER_VALUE: {
    description: 'The credentials to pass on the authentication header for ${API_NAME}',
    type: 'string',
    required: false,
    variablePlaceholder: 'API_NAME',
    sensitive: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
    sensitive: false,
  },
})

const sanitizeEnvVarName = (name: string): string => {
  return name.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')
}

const getEnvVarName = (prefix: string, name: string): string => {
  return sanitizeEnvVarName(`${prefix}_${name}`)
}

export const getApiConfig = (apiName: string, settings: typeof config.settings) => {
  const url = settings.API_NAME_API_URL.get(apiName)
  const authHeader = settings.API_NAME_AUTH_HEADER.get(apiName)
  const authHeaderValue = settings.API_NAME_AUTH_HEADER_VALUE.get(apiName)
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
