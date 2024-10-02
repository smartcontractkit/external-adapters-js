import { GeneratePriceOptions } from '@chainlink/tp-adapter'
import { ForexPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  priceEndpointInputParametersDefinition,
  PriceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { generateTransport } from '../transport/price'

const options: GeneratePriceOptions = {
  sourceName: 'icapSource',
  streamName: 'IC',
  sourceOptions: ['BGK', 'GBL', 'HKG', 'JHB'],
}

export const generateInputParams = (
  generatePriceOptions: GeneratePriceOptions,
): InputParameters<PriceEndpointInputParametersDefinition> =>
  new InputParameters(
    {
      ...priceEndpointInputParametersDefinition,
      [generatePriceOptions.sourceName]: {
        description: `Source of price data for this price pair on the ${generatePriceOptions.streamName} stream`,
        default: 'GBL',
        required: false,
        type: 'string',
        ...(generatePriceOptions.sourceOptions
          ? { options: generatePriceOptions.sourceOptions }
          : {}),
      },
    },
    [
      {
        base: 'EUR',
        quote: 'USD',
      },
    ],
  )

const inputParameters = generateInputParams(options)
const transport = generateTransport(options)

export const priceEndpoint = new ForexPriceEndpoint({
  name: 'price',
  aliases: ['forex'],
  transport,
  inputParameters,
})
