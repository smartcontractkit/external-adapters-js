import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { sanctumInfinityTransport } from '../transport/sanctum-infinity'

export const inputParameters = new InputParameters({}, [{}])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'sanctum-infinity',
  aliases: [],
  transport: sanctumInfinityTransport,
  inputParameters,
})
