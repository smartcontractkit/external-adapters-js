import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { cmeFuturesTransport } from '../transport/cme_futures'

export const inputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: 'WTI/1',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      ask_price: number
      bid_volume: 0
      ask_volume: 0
      roll_date: number
      symbol: string
      generic_symbol: string
      expiry_date: string
      contract_month: number
      ingress_ts_iso: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'cme_futures',
  aliases: [],
  transport: cmeFuturesTransport,
  customInputValidation: (_request, settings): undefined => {
    if (!settings.FUTURES_API_KEY || !settings.FUTURES_WS_API_ENDPOINT) {
      throw new AdapterError({
        statusCode: 500,
        message:
          'FUTURES_API_KEY and FUTURES_WS_API_ENDPOINT must be set in the environment to use the `cme_futures` endpoint',
      })
    }
    return
  },
  inputParameters,
})
