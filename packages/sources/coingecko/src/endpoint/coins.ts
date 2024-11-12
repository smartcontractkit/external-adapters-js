import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { transport } from '../transport/coins'

export interface CoinsResponse {
  id: string
  symbol: string
  name: string
}

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Settings: typeof config.settings
  Response: {
    Data: CoinsResponse[]
    Result: null
  }
}

export const endpoint = new AdapterEndpoint({
  name: 'coins',
  transport,
})
