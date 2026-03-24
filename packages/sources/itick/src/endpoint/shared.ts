import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(
  {
    symbol: {
      required: true,
      type: 'string',
      description: 'The symbol of the stock to query',
    },
  },
  [
    {
      symbol: '700', // exists for hk region
    },
  ],
)

export const getApiKeyForRegion = (region: string): string | undefined => {
  const envVarName = `API_KEY_${region.toUpperCase()}`
  return process.env[envVarName]
}
