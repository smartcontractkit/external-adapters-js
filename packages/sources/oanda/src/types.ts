import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from './config'

export type EndpointTypes = TransportGenerics & {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
}

export type HttpGenerics = EndpointTypes & {
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
