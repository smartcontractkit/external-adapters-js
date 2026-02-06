import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { httpTransport } from '../transport/insurance-proof'

export type EndpointResponseData = {
  result: number
  daysRemaining: number
  aum: string
}

export type EndpointResponse = {
  Result: number
  Data: EndpointResponseData
}

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: EndpointResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'insurance_proof',
  transport: httpTransport,
})
