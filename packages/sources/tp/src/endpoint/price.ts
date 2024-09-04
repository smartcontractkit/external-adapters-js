import {
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
  PriceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { generateTransport } from '../transport/price'

export type BaseEndpointTypes = WebsocketTransportGenerics & {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export type GeneratePriceOptions = {
  sourceName: 'tpSource' | 'icapSource'
  streamName: 'TP' | 'IC'
  sourceOptions?: string[]
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

const tpOptions: GeneratePriceOptions = {
  sourceName: 'tpSource',
  streamName: 'TP',
} as const

const inputParameters = generateInputParams(tpOptions)
const wsTransport = generateTransport(tpOptions)

export const priceEndpoint = new PriceEndpoint({
  name: 'price',
  aliases: ['commodities', 'forex'],
  transport: wsTransport,
  inputParameters,
})
