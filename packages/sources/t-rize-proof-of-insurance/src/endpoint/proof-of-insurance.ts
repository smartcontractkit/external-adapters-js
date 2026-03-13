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

// Mapped to Chainlink SmartData v9 report schema:
// https://docs.chain.link/data-streams/reference/report-schema-v9
//
// API field    -> v9 field      | Encoding
// root         -> navPerShare   | base64 decoded to bytes, interpreted as BigInt string
// contractId   -> aum           | hex string parsed as BigInt string
// computedAt   -> navDate       | ISO-8601 parsed to nanosecond uint64
// (hardcoded)  -> ripcord       | 0 (normal state)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      navPerShare: string
      aum: string
      navDate: string
      ripcord: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'proof_of_insurance',
  transport: httpTransport,
  inputParameters,
})
