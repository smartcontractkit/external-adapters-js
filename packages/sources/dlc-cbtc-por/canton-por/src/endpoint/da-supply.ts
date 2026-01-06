import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { transport } from '../transport/da-supply'

/**
 * String response type to handle values beyond Number.MAX_SAFE_INTEGER.
 * CBTC uses 10 decimals, so 21M supply = 2.1×10^17 base units (exceeds 9×10^15 limit).
 */
type StringResultResponse = {
  Data: { result: string }
  Result: string
}

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: StringResultResponse
  Settings: typeof config.settings
}

export const daSupply = new AdapterEndpoint({
  name: 'daSupply',
  aliases: ['daTotalSupply'],
  transport,
})
