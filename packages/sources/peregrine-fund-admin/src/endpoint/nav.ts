import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../transport/nav'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    assetId: {
      required: true,
      type: 'string',
      description: 'The identifying number for the requested asset',
    },
  },
  [
    {
      assetId: '100',
    },
  ],
)

export interface ResponseSchema {
  Id: string | null
  assetId: string
  seniorNAV: number
  juniorNav: number
  equityNav: number
  totalLiability: number
  totalAccounts: string
  totalCollateral: number
  collateral: number[]
  accounts: number[]
  updateTimestamp: string
  id: string | null
}

// Endpoints contain a type parameter that allows specifying relevant types of an endpoint, for example, request payload type, Adapter response type and Adapter configuration (environment variables) type
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  // Endpoint name
  name: 'nav',
  // Transport handles incoming requests, data processing and communication for this endpoint
  transport: httpTransport,
  //input params,
  inputParameters,
})
