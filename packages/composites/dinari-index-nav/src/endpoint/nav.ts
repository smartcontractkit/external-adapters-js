import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { navTransport } from '../transport/nav'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: navTransport,
})
