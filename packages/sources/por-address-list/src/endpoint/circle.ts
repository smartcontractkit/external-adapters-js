import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { circleTransport } from '../transport/circle'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: {
    Result: null
    Data: {
      result: PoRAddress[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'circle',
  transport: circleTransport,
})
