import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

export type BaseCryptoEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

/**
 * @deprecated This function was a no-op due to a factory-function bug: it returned a
 * transform function instead of executing one, so toLowerCase() never ran.
 * Case normalization is now handled at the framework level via NORMALIZE_CASE_INPUTS.
 * Kept as a stub for backward compatibility; remove on next major version.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function tiingoCommonSubscriptionRequestTransform() {}
