import {
  AdapterDependencies,
  EndpointContext,
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
// import { buildCacheEntriesFromResults, Transport, TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import {
  SSEConfig,
  SSETransport,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
// import { makeLogger, SingleNumberResultResponse, SubscriptionSet } from '@chainlink/external-adapter-framework/util'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
// import axios, { AxiosRequestConfig } from 'axios'
import { AxiosRequestConfig } from 'axios'
// import EventSource, { EventSourceInitDict } from 'eventsource'
// import { Cache } from '@chainlink/external-adapter-framework/cache'
// import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
// import { AdapterRequest, AdapterResponse, ProviderResult } from '@chainlink/external-adapter-framework/util/request'
import { ProviderResult } from '@chainlink/external-adapter-framework/util/request'
import Decimal from 'decimal.js'

const logger = makeLogger('OandaSSEPrice')

// interface SSEMessage {
//   type: string
//   time: string
//   bids: {
//     price: string,
//     liquidity:
//   }

//   {"bids":[{"price":"7276.1","liquidity":50},{"price":"7275.7","liquidity":100},{"price":"7274.9","liquidity":150}],"asks":[{"price":"7277.7","liquidity":50},{"price":"7278.1","liquidity":100},{"price":"7278.9","liquidity":150}],"closeoutBid":"7274.9","closeoutAsk":"7278.9","status":"tradeable","tradeable":true,"instrument":"UK100_GBP"}
//   [pair: string]: { price: number; timestamp: string }
// }

type CryptoEndpointTypes = TransportGenerics & {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: unknown //TODO
    ResponseBody: unknown //TODO
  }
}

const prepareSSEConnectionConfig: (
  params: CryptoEndpointTypes['Request']['Params'][],
  context: EndpointContext<CryptoEndpointTypes>,
) => SSEConfig = {
  //TODO
}

const prepareKeepAliveRequest: (
  context: EndpointContext<CryptoEndpointTypes>,
) => AxiosRequestConfig<CryptoEndpointTypes['Provider']['RequestBody']> = {
  //TODO
}

const prepareSubscriptionRequest: (
  params: CryptoEndpointTypes['Request']['Params'][],
  context: EndpointContext<CryptoEndpointTypes>,
) => AxiosRequestConfig<CryptoEndpointTypes['Provider']['RequestBody']> = {
  //TODO
}

const prepareUnsubscriptionRequest: (
  params: CryptoEndpointTypes['Request']['Params'][],
  context: EndpointContext<CryptoEndpointTypes>,
) => AxiosRequestConfig<CryptoEndpointTypes['Provider']['RequestBody']> = {
  //TODO
}

const eventListeners: {
  type: string
  parseResponse: (
    evt: MessageEvent<CryptoEndpointTypes['Provider']['ResponseBody']>,
  ) => ProviderResult<CryptoEndpointTypes>
}[] = [
  {
    type: 'PRICE',
    parseResponse: (evt: MessageEvent) => {
      const liquidBid = new Decimal(evt.bids[evt.bids.length - 1].price)
      const liquidAsk = new Decimal(evt.asks[evt.asks.length - 1].price)

      const price = liquidBid.add(liquidAsk).div(2).toNumber()

      const assets = evt.instrument.split('_')

      const result: ProviderResult<T> = {
        params: {
          base: assets[0],
          quote: assets[1],
        },
        response: price,
      }
      return result
    },
  },
]

const transport = new (class extends SSETransport<CryptoEndpointTypes> {
  constructor() {
    super({
      prepareSSEConnectionConfig,
      prepareKeepAliveRequest,
      prepareSubscriptionRequest,
      prepareUnsubscriptionRequest,
      eventListeners,
    })
  }
})()

// class OandaSSETransport<T extends OandaSSETransportTypes> implements Transport<T> {
//   cache!: Cache<AdapterResponse<T['Response']>>
//   eventListeners!: [
//     {
//       type: 'PRICE',
//       parseResponse: (evt: MessageEvent) => {
//        const liquidBid = new Decimal(evt.bids[evt.bids.length - 1].price)
//        const liquidAsk = new Decimal(evt.asks[evt.asks.length - 1].price)

//        const price = liquidBid.add(liquidAsk).div(2).toNumber()

//         const assets = evt.instrument.split('_')

//        const result: ProviderResult<T> = {
//          params: {
//            base: assets[0],
//            quote: assets[1]
//          },
//          response: price
//        }
//        return result
//       }
//     }
//   ]
//     {
//     type: string
//     parseResponse: (evt: MessageEvent) => ProviderResult<T>
//   }[]
//   sseConnection?: EventSource
//   subscriptionSet!: SubscriptionSet<T['Request']['Params']>
//   timeOfLastReq = 0
//   localSubscriptions: T['Request']['Params'][] = []

//   constructor() {
//     // Empty constructor
//   }

//   async initialize(
//     dependencies: AdapterDependencies,
//     config: AdapterConfig<T['CustomSettings']>,
//     endpointName: string,
//   ): Promise<void> {
//     this.cache = dependencies.cache as Cache<AdapterResponse<T['Response']>>
//     this.subscriptionSet = dependencies.subscriptionSetFactory.buildSet(endpointName)
//   }

//   async registerRequest(
//     req: AdapterRequest<T['Request']>,
//     config: AdapterConfig<T['CustomSettings']>,
//   ): Promise<void> {
//     logger.debug(
//       `Adding entry to subscription set (ttl: ${config.SSE_SUBSCRIPTION_TTL}): [${req.requestContext.cacheKey}] = ${req.requestContext.data}`,
//     )
//     await this.subscriptionSet.add(
//       req.requestContext.cacheKey,
//       req.requestContext.data,
//       config.SSE_SUBSCRIPTION_TTL,
//     )
//   }

//   async backgroundExecute(context: EndpointContext<T>): Promise<number> {
//     logger.debug('Starting background execute, getting subscriptions from sorted set')
//     const desiredSubs = await this.subscriptionSet.getAll()

//     logger.debug('Generating delta (subscribes & unsubscribes)')
//     const subscribeParams = desiredSubs.filter((s) => !this.localSubscriptions.includes(s))
//     const unsubscribeParams = this.localSubscriptions.filter((s) => !desiredSubs.includes(s))

//     logger.debug(
//       `${subscribeParams.length} new subscriptions; ${unsubscribeParams.length} to unsubscribe`,
//     )
//     if (subscribeParams.length) {
//       logger.trace(`Will subscribe to: ${subscribeParams}`)
//     }
//     if (unsubscribeParams.length) {
//       logger.trace(`Will unsubscribe from: ${unsubscribeParams}`)
//     }

//     if (
//       (subscribeParams.length || unsubscribeParams.length) &&
//       (!this.sseConnection || this.sseConnection.readyState !== this.sseConnection.OPEN)
//     ) {
//       logger.debug('No established connection and new subscriptions available, connecting to SSE')

//       const url = context.adapterConfig.SSE_API_ENDPOINT + '/accounts/' + context.adapterConfig.API_ACCOUNT_ID

//       const eventSourceInitDict: EventSourceInitDict = {
//         headers: { "Authorization": 'Bearer ' + context.adapterConfig.API_KEY }
//       }

//       this.sseConnection = new EventSource(url, eventSourceInitDict)

//       const eventHandlerGenerator = (listener: typeof this.eventListeners[0]) => {
//         return (e: MessageEvent) => {
//           const providerResponses = listener.parseResponse(e)
//           const cacheEntries = buildCacheEntriesFromResults(providerResponses, context)
//           this.cache.setMany(cacheEntries, context.adapterConfig.CACHE_MAX_AGE)
//         }
//       }

//       this.config.eventListeners.forEach((listener) => {
//         this.sseConnection?.addEventListener(listener.type, eventHandlerGenerator(listener))
//       })
//     }

//     // Start TODO

//     const makeRequest = async (req: AxiosRequestConfig<T['Provider']['RequestBody']>) => {
//       try {
//         const res = await axios.request(req)
//         logger.debug(res.data, `response status ${res.statusText} from keepalive request`)
//       } catch (err) {
//         logger.error(err, `Error on keepalive request`)
//       }
//       this.timeOfLastReq = Date.now()
//     }

//     if (subscribeParams.length) {
//       //TODO use subscribeParams to make subscription request
//       const subscribeRequest = this.config.prepareSubscriptionRequest(subscribeParams, context)
//       makeRequest(subscribeRequest)
//     }
//     if (unsubscribeParams.length) {
//       const unsubscribeRequest = this.config.prepareUnsubscriptionRequest(
//         unsubscribeParams,
//         context,
//       )
//       makeRequest(unsubscribeRequest)
//     }
//     if (
//       this.config.prepareKeepAliveRequest &&
//       desiredSubs.length &&
//       Date.now() - this.timeOfLastReq > context.adapterConfig.SSE_KEEPALIVE_SLEEP
//     ) {
//       const prepareKeepAliveRequest = this.config.prepareKeepAliveRequest(context)
//       makeRequest(prepareKeepAliveRequest)
//     }

//     logger.debug('Setting local state to cache value')
//     this.localSubscriptions = desiredSubs

//     logger.debug('Background execute complete')
//     return context.adapterConfig.SSE_SUBSCRIPTION_UPDATE_SLEEP
//   }
// }

// End TODO

export const cryptoEndpoint = new PriceEndpoint({
  name: 'crypto',
  aliases: ['price'],
  inputParameters: priceEndpointInputParameters,
  // transport: new OandaSSETransport(),
  transport,
})
