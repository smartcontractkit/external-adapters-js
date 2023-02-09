import {
  EndpointContext,
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { HttpTransport, TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import Decimal from 'decimal.js'
import axios from 'axios'

import { customSettings } from '../config'
import restPairs from '../config/restPairs.json'
import { ModifiedSseTransport } from '../transport/modifiedSSE'

const logger = makeLogger('OandaPrice')

type RestPairs = { [base: string]: { [quote: string]: boolean } }

type EndpointTypes = TransportGenerics & {
  Request: {
    Params: PriceEndpointParams & {
      transport?: 'REST' | 'SSE'
    }
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

type InstrumentList = { instruments: Array<{ name: string; type: string }> }

type InstrumentMap = { [base: string]: { [quote: string]: string } }

let instrumentMap: InstrumentMap

// Get mapping of all available instruments keyed by base and quote assets
const setInstrumentMap = async (context: EndpointContext<ModifiedSseGenerics>) => {
  logger.info({ msg: 'Setting instrument map' })
  const { data, status } = await axios.get<InstrumentList>(
    `${context.adapterConfig.INSTRUMENTS_API_ENDPOINT}/accounts/${context.adapterConfig.API_ACCOUNT_ID}/instruments`,
    {
      headers: {
        contentType: 'application/json',
        Authorization: `Bearer ${context.adapterConfig.SSE_API_KEY}`,
      },
    },
  )

  if (!data || status !== 200) {
    throw new AdapterError({ message: 'Could not fetch asset list', providerStatusCode: status })
  }

  instrumentMap = data.instruments.reduce((instrumentMap: InstrumentMap, item) => {
    const [base, quote] = item.name.split('_')
    instrumentMap[base] = instrumentMap[base] ?? {}
    instrumentMap[base][quote] = item.name
    return instrumentMap
  }, {})
}

// See https://developer.oanda.com/rest-live-v20/pricing-ep/
const sseTransport = new ModifiedSseTransport<ModifiedSseGenerics>({
  prepareSSEConnectionConfig: (subsList, context) => {
    const url = `${context.adapterConfig.SSE_API_ENDPOINT}/accounts/${
      context.adapterConfig.API_ACCOUNT_ID
    }/pricing/stream?instruments=${subsList.join('%2C')}`
    return {
      url,
      config: {
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${context.adapterConfig.SSE_API_KEY}`,
        },
      },
    }
  },
  parseSubscriptionList: async (subscriptions, context) => {
    if (!instrumentMap) await setInstrumentMap(context)

    return subscriptions.map(({ base, quote }) => instrumentMap?.[base]?.[quote] ?? undefined)
  },
  eventListeners: [
    {
      type: 'PRICE',
      parseResponse: (
        event: MessageEvent<ModifiedSseGenerics['Provider']['ResponseBody']>['data'],
      ) => {
        logger.info({ event })
        const { bids, asks, instrument, time } = event
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
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(time).getTime(),
              },
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
    const { base, quote, transport } = req.requestContext.data

    if (transport) return transport

    const route = (restPairs as RestPairs)?.[base]?.[quote] ? 'REST' : 'SSE'

    return route
  },
)

export const priceEndpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['forex'],
  inputParameters: priceEndpointInputParameters,
  transport: routerTransport,
})
