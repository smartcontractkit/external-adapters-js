import {
  EndpointContext,
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'

import Decimal from 'decimal.js'
import axios from 'axios'

import restPairs from '../config/restPairs.json'
import { ModifiedSseTransport } from '../transport/modifiedSSE'
import {
  EndpointTypes,
  HttpGenerics,
  InstrumentList,
  InstrumentMap,
  ModifiedSseGenerics,
  RestPairs,
} from '../types'

const logger = makeLogger('OandaPrice')

let instrumentMap: InstrumentMap

// Get mapping of all available instruments keyed by base and quote assets
const setInstrumentMap = async (context: EndpointContext<ModifiedSseGenerics>) => {
  logger.info({ msg: 'Setting instrument map' })

  const providerDataRequestedUnixMs = Date.now()

  const { data, status } = await axios.get<InstrumentList>(
    `${context.adapterConfig.INSTRUMENTS_API_ENDPOINT}/accounts/${context.adapterConfig.API_ACCOUNT_ID}/instruments`,
    {
      headers: {
        contentType: 'application/json',
        Authorization: `Bearer ${context.adapterConfig.SSE_API_KEY}`,
      },
    },
  )

  const providerDataReceivedUnixMs = Date.now()

  if (!data || status !== 200) {
    throw new AdapterDataProviderError(
      {
        message: 'Could not fetch asset list',
        providerStatusCode: status,
      },
      {
        providerDataReceivedUnixMs,
        providerDataRequestedUnixMs,
        providerIndicatedTimeUnixMs: undefined,
      },
    )
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
