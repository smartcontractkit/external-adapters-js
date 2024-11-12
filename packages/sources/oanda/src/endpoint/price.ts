import {
  EndpointContext,
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport, TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'

import Decimal from 'decimal.js'
import axios from 'axios'

import restPairs from '../config/restPairs.json'
import { ModifiedSseTransport } from '../transport/modifiedSSE'
import {
  EndpointTypes,
  HttpTransportTypes,
  InstrumentList,
  InstrumentMap,
  ModifiedSseGenerics,
  RestPairs,
} from '../types'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const logger = makeLogger('OandaPrice')

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'CAD',
    quote: 'USD',
  },
])

let instrumentMap: InstrumentMap

// Get mapping of all available instruments keyed by base and quote assets
const getInstrumentMap = async (context: EndpointContext<ModifiedSseGenerics>) => {
  if (instrumentMap) return instrumentMap

  logger.info({ msg: 'Setting instrument map' })

  const providerDataRequestedUnixMs = Date.now()

  const { data, status } = await axios.get<InstrumentList>(
    `${context.adapterSettings.INSTRUMENTS_API_ENDPOINT}/accounts/${context.adapterSettings.API_ACCOUNT_ID}/instruments`,
    {
      headers: {
        contentType: 'application/json',
        Authorization: `Bearer ${context.adapterSettings.SSE_API_KEY}`,
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

  return instrumentMap
}

// See https://developer.oanda.com/rest-live-v20/pricing-ep/
const sseTransport = new ModifiedSseTransport<ModifiedSseGenerics>({
  prepareSSEConnectionConfig: (subsList, context) => {
    const url = `${context.adapterSettings.SSE_API_ENDPOINT}/accounts/${
      context.adapterSettings.API_ACCOUNT_ID
    }/pricing/stream?instruments=${subsList.join('%2C')}`
    return {
      url,
      config: {
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${context.adapterSettings.SSE_API_KEY}`,
        },
      },
    }
  },
  parseSubscriptionList: async (subscriptions, context) => {
    instrumentMap = await getInstrumentMap(context)

    const foundInstruments: Record<string, boolean> = {}

    return subscriptions.reduce((instrumentList: string[], { base, quote }) => {
      base = base.toUpperCase()
      quote = quote.toUpperCase()
      const instrument = instrumentMap?.[base]?.[quote]
      if (instrument) {
        if (!foundInstruments[instrument]) {
          foundInstruments[instrument] = true
          instrumentList.push(instrument)
        }
      } else {
        logger.error({ msg: `${base}_${quote} instrument not found in asset list` })
      }
      return instrumentList
    }, [])
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
const restTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) =>
    params.map((p) => {
      const { base, quote } = p

      return {
        params: [p],
        request: {
          baseURL: config.API_ENDPOINT,
          url: 'rates/spot.json',
          params: {
            base: base.toUpperCase(),
            quote: quote.toUpperCase(),
          },
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

export const priceEndpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['forex'],
  inputParameters,
  transportRoutes: new TransportRoutes<EndpointTypes>()
    .register('sse', sseTransport)
    .register('rest', restTransport),
  customRouter: (req, _) => {
    const { base, quote, transport } = req.requestContext
      .data as typeof inputParameters.validated & { transport?: string }

    if (transport) return transport

    const route = (restPairs as RestPairs)?.[base.toUpperCase()]?.[quote.toUpperCase()]
      ? 'rest'
      : 'sse'

    return route
  },
})
