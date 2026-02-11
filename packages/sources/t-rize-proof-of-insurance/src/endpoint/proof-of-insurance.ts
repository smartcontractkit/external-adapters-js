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

// insuredAllocationLimit: Decimal  # buyer-level cap
// masterCoverageLimit: Decimal     # deal-level cap
// dealCurrentExposure: Decimal     # Deal-level used/consumed insured coverage (USD-equivalent) as-of `timestamp`, across ALL buyers/instruments under the same deal
// timestamp: Time                  # as-of time
// signature: String                # oracle signature
// maturityTimestamp: Time          # policy valid-until
// policyHash: String               # 192-bit leftmost truncated sha-256

// And the combination of fields required to identify the token on-chain:
// instrumentId: Text                # binds attestation to "deal-X-for-buyer-Y"
// instrumentSourceParty: PartyID    # PartyID of the Token Registrar

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      // navDate: number
      // aum: string
      insuredAllocationLimit: number // buyer-level cap (Decimal)
      masterCoverageLimit: number // deal-level cap (Decimal)
      dealCurrentExposure: number // Deal-level used/consumed insured coverage (USD-equivalent) as-of timestamp
      timestamp: number // as-of time (Time)
      signature: string // oracle signature
      maturityTimestamp: number // policy valid-until (Time)
      policyHash: string // 192-bit leftmost truncated sha-256
      // Token identification on-chain
      instrumentId: string // binds attestation to "deal-X-for-buyer-Y" (Text)
      instrumentSourceParty: string // PartyID of the Token Registrar
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'proof_of_insurance',
  transport: httpTransport,
  inputParameters,
})
