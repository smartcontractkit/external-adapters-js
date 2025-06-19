import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/price'

// Input parameters define the structure of the request expected by the endpoint. The second parameter defines example input data that will be used in EA readme
export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
    },
    quote: {
      aliases: ['to', 'convert'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
  },
  [
    {
      base: 'BTC',
      quote: 'USD',
    },
  ],
)

export type BidAskMidResponse = {
  Result: number
  Data: {
    ticker: string
    ask: string
    bid: string
    mid: string
    ts: number
  }
  receivedTs: number
}

// Endpoints contain a type parameter that allows specifying relevant types of an endpoint, for example, request payload type, Adapter response type and Adapter configuration (environment variables) type
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: BidAskMidResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  // Endpoint name
  name: 'price', // ice instead?
  // Alternative endpoint names for this endpoint
  aliases: ['latest-price', 'data-price', 'getReqObjPrice'],
  // Transport handles incoming requests, data processing and communication for this endpoint
  transport: transport,
  // Supported input parameters for this endpoint
  inputParameters,
  // Overrides are defined in the `/config/overrides.json` file. They allow input parameters to be overriden from a generic symbol to something more specific for the data provider such as an ID.
  overrides: overrides['ice'],
})
