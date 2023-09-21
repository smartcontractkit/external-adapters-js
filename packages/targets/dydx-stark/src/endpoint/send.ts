import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/send'

export const inputParameters = new InputParameters(
  {
    asset: {
      description: 'Required asset name (of your choice, per asset. for example "BTCUSD")',
      type: 'string',
      required: true,
    },
    result: {
      aliases: ['price'],
      required: true,
      type: 'number',
      description: 'Price data that will  be sent to dydx',
    },
  },
  [
    {
      asset: 'BTCUSD',
      result: 27000,
    },
  ],
)

export type DyDxResponse = { market: string; price: string }

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    // The actual Result from transport has DyDxResponse type.
    //'string' is used as ea-framework doesn't support complex types for Response.Result
    Result: string
    Data: {
      result: DyDxResponse
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'send',
  transport,
  inputParameters,
})
