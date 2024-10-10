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
import { streamNameToAdapterNameOverride } from '../transport/util'

export type QueryParams = {
  streamName: 'TP' | 'IC'
}

export type BaseEndpointTypes = WebsocketTransportGenerics & {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

// Used by ICAP EA only, remove after EA is removed
export type GeneratePriceOptions = {
  sourceName: 'tpSource' | 'icapSource'
  streamName: 'TP' | 'IC'
  sourceOptions?: string[]
}

export const generateInputParams = (): InputParameters<PriceEndpointInputParametersDefinition> =>
  new InputParameters(
    {
      ...priceEndpointInputParametersDefinition,
      streamName: {
        aliases: ['source'],
        description: "TP ('TP') or ICAP ('IC')",
        options: ['TP', 'IC'],
        default: 'TP',
        required: false,
        type: 'string',
      },
      sourceName: {
        aliases: ['tpSource'], // for backward compatibility, icapSource is not used
        description: `Source of price data for this price pair on the stream`,
        default: 'GBL',
        required: false,
        type: 'string',
      },
    },
    [
      {
        base: 'EUR',
        quote: 'USD',
        streamName: 'TP',
        sourceName: 'GBL',
      },
    ],
  )

const inputParameters = generateInputParams()
const wsTransport = generateTransport()

export const priceEndpoint = new PriceEndpoint({
  name: 'price',
  aliases: ['commodities', 'forex'],
  transport: wsTransport,
  inputParameters,
  requestTransforms: [
    (req) => {
      // use query param streamName as replacement due to combination
      const rq = req.query as QueryParams
      if (rq.streamName) {
        req.requestContext.data.streamName = rq.streamName.toUpperCase()
      }

      req.requestContext.data.adapterNameOverride = streamNameToAdapterNameOverride(
        String(req.requestContext.data.streamName),
      )
    },
  ],
})
