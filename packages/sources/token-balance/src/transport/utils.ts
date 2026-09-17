import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export type SharePriceType = {
  value: bigint
  decimal: number
}

export const getNetworkEnvVar = (network: string, suffix: string): string => {
  const envVarName = `${network.toUpperCase()}${suffix}`
  const envVar = process.env[envVarName]
  if (!envVar) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Environment variable ${envVarName} is missing`,
    })
  }
  return envVar
}
