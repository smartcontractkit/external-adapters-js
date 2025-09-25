import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { navTransport } from '../transport/nav'
import { inputParameters } from './reserve'

export type NavResultResponse = {
  Result: number
  Data: {
    fundId: number
    fundName: string
    netAssetValue: number
    navDate: string
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: NavResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  inputParameters,
  transport: navTransport,
})
