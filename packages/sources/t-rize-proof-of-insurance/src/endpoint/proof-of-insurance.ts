import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/proof-of-insurance'

export const inputParameters = new InputParameters(
  {
    deal_name: {
      required: true,
      type: 'string',
      description: 'Deal name for the insurance product',
    },
    instrument_id: {
      required: true,
      type: 'string',
      description: 'Instrument ID for the insurance product',
    },
  },
  [
    {
      deal_name: 'Entity 2 Deal',
      instrument_id: 'DEAL-ENTITY2-EXAMPLE',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      navDate: number
      aum: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'proof_of_insurance',
  transport: httpTransport,
  inputParameters,
})
