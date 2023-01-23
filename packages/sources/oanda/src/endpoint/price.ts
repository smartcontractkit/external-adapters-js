import {
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { HttpTransport, TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import Decimal from 'decimal.js'

import { customSettings } from '../config'
import { ModifiedSseTransport } from '../transport/modifiedSSE'

type EndpointTypes = TransportGenerics & {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
}

type ModifiedSseGenerics = EndpointTypes & {
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

// See https://developer.oanda.com/rest-live-v20/pricing-ep/
const sseTransport = new ModifiedSseTransport<ModifiedSseGenerics>({
  prepareSSEConnectionConfig: (subscriptions, context) => {
    const instruments = subscriptions.desired.map((s) => `${s.base}_${s.quote}`)
    return {
      url: `${context.adapterConfig.SSE_API_ENDPOINT}/accounts/${
        context.adapterConfig.API_ACCOUNT_ID
      }/pricing/stream?instruments=${instruments.join('%2C')}`,
      headers: { Authorization: `Bearer: ${context.adapterConfig.SSE_API_KEY}` },
    }
  },
  eventListeners: [
    {
      type: 'PRICE',
      parseResponse: (evt: MessageEvent<ModifiedSseGenerics['Provider']['ResponseBody']>) => {
        const { bids, asks, instrument, time } = evt.data
        const liquidBid = new Decimal(bids[bids.length - 1].price)
        const liquidAsk = new Decimal(asks[asks.length - 1].price)

        const result = liquidBid.add(liquidAsk).div(2).toNumber()

        const [base, quote] = instrument.split('_')

        return [
          {
            params: { base, quote },
            response: {
              data: { result },
              result,
            },
            timestamps: {
              providerIndicatedTime: time,
            },
          },
        ]
      },
    },
  ],
})

type HttpGenerics = EndpointTypes & {
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

// See https://developer.oanda.com/exchange-rates-api/#get-/v2/rates/spot.-ext-
const restTransport = new HttpTransport<HttpGenerics>({
  prepareRequests: (params: PriceEndpointParams[], config) =>
    params.map((p) => {
      const { base, quote } = p
      return {
        params: [p],
        request: {
          baseURL: config.API_ENDPOINT,
          url: 'rates/spot.json',
          params: { base, quote },
          headers: { Authorization: `Bearer ${config.API_KEY}` },
        },
      }
    }),
  parseResponse: (params, res) => {
    return params.map((p) => {
      const result = parseFloat(res.data.quotes[0].midpoint)
      return {
        params: p,
        response: {
          data: { result },
          result,
        },
      }
    })
  },
})

const routerTransport = new RoutingTransport<EndpointTypes>(
  { SSE: sseTransport, REST: restTransport },
  (req) => {
    //TODO add transport input param to force routing behavior if needed
    const restInstrumentList = [
      ['IDR', 'USD'], //TODO clarify if inverse or not
      ['INR', 'USD'],
      ['USD', 'IDR'],
      ['USD', 'INR'],
    ]

    return restInstrumentList.some(
      (i) => i[0] === req.requestContext.data.base && i[1] === req.requestContext.data.quote,
    )
      ? 'REST'
      : 'SSE'
  },
)

export const priceEndpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['forex'],
  inputParameters: priceEndpointInputParameters,
  transport: routerTransport,
})
