import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { gasPriceTransport } from '../transport/gasprice'

export const inputParameters = new InputParameters({})

// Endpoints contain a type parameter that allows specifying relevant types of an endpoint, for example, request payload type, Adapter response type and Adapter configuration (environment variables) type
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: string
    }
    Result: string
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  // Endpoint name
  name: 'gasprice',
  // Alternative endpoint names for this endpoint
  aliases: ['gas_price'],
  // Transport handles incoming requests, data processing and communication for this endpoint
  transport: gasPriceTransport,
  // Supported input parameters for this endpoint
  inputParameters,
})
