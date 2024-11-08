import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { sleep, makeLogger } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes } from '../endpoint/state'

import { generateCreds, getProviderIndicatedTimeUnixMs } from './utils'
import { ClientReadableStream, ServiceError } from '@grpc/grpc-js'
import { BehaviorSubject, distinctUntilChanged, from, fromEvent, switchMap } from 'rxjs'
import { backOff } from 'exponential-backoff'

import { StreamAggregatedStatePriceServiceV1Client } from '@kaiko-data/sdk-node/sdk/sdk_grpc_pb'
import { StreamAggregatedStatePriceRequestV1 } from '@kaiko-data/sdk-node/sdk/stream/aggregated_state_price_v1/request_pb'
import { StreamAggregatedStatePriceResponseV1 } from '@kaiko-data/sdk-node/sdk/stream/aggregated_state_price_v1/response_pb'

const logger = makeLogger('KaikoStateTransport')

export type KaikoStateTransportTypes = BaseEndpointTypes

export class KaikoStateTransport extends SubscriptionTransport<KaikoStateTransportTypes> {
  async initialize(
    dependencies: TransportDependencies<KaikoStateTransportTypes>,
    adapterSettings: KaikoStateTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this._start(adapterSettings.API_ENDPOINT, adapterSettings.API_KEY)
  }

  async _start(endpoint: string, apiKey: string) {
    const client = new StreamAggregatedStatePriceServiceV1Client(endpoint, generateCreds(apiKey))
    const request = new StreamAggregatedStatePriceRequestV1()
    request.setAssetsList(['*'])

    const sub = new BehaviorSubject<ClientReadableStream<StreamAggregatedStatePriceResponseV1>>(
      await this._subscribe(client, request),
    )

    sub
      .pipe(
        distinctUntilChanged(), // avoid looping when subscription is updated
        switchMap((e) => fromEvent(e, 'end')), // listen for end of stream event
        switchMap(() => {
          logger.info('Resubscribing after end of stream')
          return from(this._subscribe(client, request)) // resubscribe when 'end' event is emitted
        }),
      )
      .subscribe(sub) // trigger next listens
  }

  async _subscribe(
    client: StreamAggregatedStatePriceServiceV1Client,
    request: StreamAggregatedStatePriceRequestV1,
  ) {
    const providerDataRequestedUnixMs = Date.now()

    const subscription = await backOff<ClientReadableStream<StreamAggregatedStatePriceResponseV1>>(
      () =>
        new Promise((resolve, reject) => {
          try {
            resolve(client.subscribe(request))
          } catch (e) {
            reject(e)
          }
        }),
      {
        jitter: 'full',
        numOfAttempts: 10,
        startingDelay: 100, //ms
      },
    )

    subscription.on('data', (response: StreamAggregatedStatePriceResponseV1) => {
      const cacheData = []
      if (response.getAggregatedPriceEth().length > 0) {
        cacheData.push(
          this._generateResponse(
            'ETH',
            response.getAggregatedPriceEth(),
            providerDataRequestedUnixMs,
            response,
          ),
        )
      }
      if (response.getAggregatedPriceUsd().length > 0) {
        cacheData.push(
          this._generateResponse(
            'USD',
            response.getAggregatedPriceUsd(),
            providerDataRequestedUnixMs,
            response,
          ),
        )
      }

      this.responseCache.write(this.name, cacheData)
    })

    subscription.on('end', () => {
      logger.info('Stream ended')
    })

    subscription.on('error', (error: ServiceError) => {
      logger.error(error)
    })

    logger.info('Stream started')

    return subscription
  }

  _generateResponse(
    quote: string,
    price: string,
    providerDataRequestedUnixMs: number,
    response: StreamAggregatedStatePriceResponseV1,
  ) {
    return {
      params: {
        base: response.getBase().toUpperCase(),
        quote: quote,
      },
      response: {
        data: {
          result: Number(price),
        },
        statusCode: 200,
        result: Number(price),
        timestamps: {
          providerDataRequestedUnixMs: providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: getProviderIndicatedTimeUnixMs(response),
        },
      },
    }
  }

  async backgroundHandler(context: EndpointContext<KaikoStateTransportTypes>) {
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  getSubscriptionTtlFromConfig(adapterSettings: KaikoStateTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const kaikoStateTransport = new KaikoStateTransport()
