import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from './config'
import { inputParameters } from './endpoint/price'

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export type HttpTransportTypes = EndpointTypes & {
  Provider: {
    RequestBody: unknown
    ResponseBody: {
      meta: {
        effective_params: {
          data_set: 'OANDA'
          base_currencies: string[]
          quote_currencies: string[]
          decimal_places: null
        }
        endpoint: 'spot'
        request_time: string
        skipped_currency_pairs: []
      }
      quotes: [
        {
          base_currency: string
          quote_currency: string
          bid: string
          ask: string
          midpoint: string
        },
      ]
    }
  }
}

export type InstrumentList = { instruments: Array<{ name: string; type: string }> }

export type InstrumentMap = { [base: string]: { [quote: string]: string } }

export type ModifiedSseGenerics = EndpointTypes & {
  Provider: {
    ResponseBody: {
      type: string
      time: string
      bids: {
        price: string
        liquidity: number
      }[]
      asks: {
        price: string
        liquidity: number
      }[]
      closeoutBid: string
      closeoutAsk: string
      status: string
      tradeable: boolean
      instrument: string
    }
  }
}

export type RestPairs = { [base: string]: { [quote: string]: boolean } }
