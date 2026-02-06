import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/insurance-proof'

export const inputParameters = new InputParameters({})

export type EndpointResponse = {
  Result: number
  Data: {
    navDate: number
    aum: string
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: EndpointResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'insurance_proof',
  transport: httpTransport,
  inputParameters,
})
