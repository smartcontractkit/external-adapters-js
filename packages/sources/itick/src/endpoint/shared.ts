import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: '700$hk',
  },
])

export const getBaseRegion = (input: string) => {
  const parts = input.split('$')

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'Symbol must be in the format of "${ticker}$${region}" for example "700$hk"',
    })
  }
  return {
    base: parts[0],
    region: parts[1],
  }
}
