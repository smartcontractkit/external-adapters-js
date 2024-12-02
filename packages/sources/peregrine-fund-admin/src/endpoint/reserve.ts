import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../transport/reserve'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const inputParameters = new InputParameters({
  assetId: {
    required: true,
    type: 'string',
    description: 'The identifying number for the requested asset',
  },
})

export interface ResponseSchema {
  assetId: string
  totalValue: number
  currencyBase: string
  accountIds: number[]
  updateDateTime: string
}

// Endpoints contain a type parameter that allows specifying relevant types of an endpoint, for example, request payload type, Adapter response type and Adapter configuration (environment variables) type
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      totalValue: number
      updateDateTime: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  // Endpoint name
  name: 'reserve',
  // Supported input parameters for this endpoint
  inputParameters,
  // Transport handles incoming requests, data processing and communication for this endpoint
  transport: httpTransport,
  // Input params
  inputParameters,
})
