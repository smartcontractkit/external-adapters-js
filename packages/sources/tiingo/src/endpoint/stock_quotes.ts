import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { wsTransport } from '../transport/stock_quotes-ws'
import { tiingoCommonSubscriptionRequestTransform } from './utils'

const inputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: 'aapl',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number
      ask_price: number
      ask_volume: number
    }
  }
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  transport: wsTransport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
  requestTransforms: [tiingoCommonSubscriptionRequestTransform()],
})
