import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { solvHttpTransport } from '../transport/solvBTC'

export const inputParameters = new InputParameters(
  {
    type: {
      description: 'The type of bitcoin which we are fetching addresses for',
      options: ['BTC', 'BBN', 'ENA', 'CORE', 'JUP', 'TRADING'],
      type: 'string',
      default: 'BTC',
    },
  },
  [
    {
      type: 'BTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'solvBtcAddress',
  transport: solvHttpTransport,
  inputParameters,
})
