import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { transport } from '../transport/reserves'

/**
 * String response type for Bitcoin reserves
 */
export type StringResultResponse = {
  Data: { result: string }
  Result: string
}

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: StringResultResponse
  Settings: typeof config.settings
}

export const reserves = new AdapterEndpoint({
  name: 'reserves',
  aliases: ['por'],
  transport,
})
