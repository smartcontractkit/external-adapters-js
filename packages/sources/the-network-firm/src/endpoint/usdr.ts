import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { httpTransport } from '../transport/usdr'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'usdr',
  transport: httpTransport,
})
