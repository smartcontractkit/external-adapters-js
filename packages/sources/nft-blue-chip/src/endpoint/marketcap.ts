import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { transport } from '../transport/marketcap'
import { config } from '../config'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Provider: {
    RequestBody: unknown
    ResponseBody: unknown
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'marketcap',
  transport,
})
