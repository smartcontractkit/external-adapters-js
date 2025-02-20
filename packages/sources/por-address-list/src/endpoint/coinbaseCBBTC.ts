import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { coinbaseHttpTransport } from '../transport/coinbaseBTC'


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
  name: 'coinbaseBtcAddress',
  transport: coinbaseHttpTransport,
})
