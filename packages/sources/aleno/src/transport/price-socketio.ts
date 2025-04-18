import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { io, Socket } from 'socket.io-client'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('SocketIOTransport')

interface ResponseItem {
  id: string
  baseSymbol: string
  quoteSymbol: string
  processTimestamp: number
  processBlockChainId: string
  processBlockNumber: number
  processBlockTimestamp: number
  aggregatedLast7DaysBaseVolume: number
  price: number
  aggregatedMarketDepthMinusOnePercentUsdAmount: number
  aggregatedMarketDepthPlusOnePercentUsdAmount: number
  aggregatedMarketDepthUsdAmount: number
  aggregatedLast7DaysUsdVolume: number
}

type ResponseSchema = ResponseItem[]

export type SocketIOTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

const getSetDelta = (original: Set<string>, toRemove: Set<string>): string[] => {
  const delta: string[] = []
  for (const item of original) {
    if (!toRemove.has(item)) {
      delta.push(item)
    }
  }
  return delta
}

class TimeoutError extends Error {}

export class SocketIOTransport extends StreamingTransport<SocketIOTransportTypes> {
  socket?: Socket = undefined
  confirmedSubscriptions: Set<string> | undefined = new Set()

  constructor() {
    super()
  }

  override async initialize(
    dependencies: TransportDependencies<SocketIOTransportTypes>,
    settings: typeof config.settings,
    endpointName: string,
    name: string,
  ): Promise<void> {
    super.initialize(dependencies, settings, endpointName, name)
  }

  establishWsConnection(adaptersettings: typeof config.settings): Socket {
    return io(adaptersettings.WS_API_ENDPOINT, {
      auth: {
        apiKey: adaptersettings.API_KEY,
      },
    })
  }

  async parseResponseData(
    providerDataStreamEstablishedTime: number,
    data: ResponseSchema,
  ): Promise<void> {
    data.forEach((row) => {
      this.responseCache.write(this.name, [
        {
          params: {
            base: row.baseSymbol,
            quote: row.quoteSymbol,
          },
          response: {
            data: {
              result: row.price,
            },
            result: row.price,
            timestamps: {
              providerDataStreamEstablishedUnixMs: providerDataStreamEstablishedTime,
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: row.processTimestamp * 1000,
            },
          },
        },
      ])
    })
  }

  async emitAndUpdateConfirmedSubscriptions(
    context: EndpointContext<SocketIOTransportTypes>,
    event: string,
    subscriptions: string[],
  ): Promise<void> {
    type SubscribeResponse = { status: string; subscriptionsAfterUpdate: string[] }

    // We block on getting the confirmed subscriptions to avoid race
    // conditions between concurrent subscription updates.
    // So we need to timeout to avoid blocking all progress or keeping a race
    // condition if the background execute loop times out and continues.
    const timeoutPromise = new Promise<SubscribeResponse>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('Timed out waiting for subscription confirmation'))
      }, context.adapterSettings.API_TIMEOUT)
    })

    const subscribePromise = new Promise<SubscribeResponse>((resolve, reject) => {
      this.socket!.emit(event, subscriptions, (response: SubscribeResponse) => {
        if (response.status === 'ok') {
          logger.info({
            msg: 'Subscription update successful:',
            response,
          })
          // Don't update confirmedSubscriptions here in case the request
          // has already timed out.
          resolve(response)
        } else {
          logger.error({ msg: 'Subscription update failed:', response })
          reject(response)
        }
      })
    })

    try {
      const response: SubscribeResponse = await Promise.race([subscribePromise, timeoutPromise])
      this.confirmedSubscriptions = new Set(
        response.subscriptionsAfterUpdate.map((sub) => sub.toUpperCase()),
      )
    } catch (error) {
      // We can't be sure if the update was made, so we make sure we fetch
      // subscriptions again by clearing confirmedSubscriptions.
      this.confirmedSubscriptions = undefined

      if (error instanceof TimeoutError) {
        logger.error({ msg: error.message, subscriptions })
      }
      throw error
    }
  }

  addSubscriptions(
    context: EndpointContext<SocketIOTransportTypes>,
    subscriptions: string[],
  ): Promise<void> {
    return this.emitAndUpdateConfirmedSubscriptions(context, 'subscribe', subscriptions)
  }

  removeSubscriptions(
    context: EndpointContext<SocketIOTransportTypes>,
    subscriptions: string[],
  ): Promise<void> {
    return this.emitAndUpdateConfirmedSubscriptions(context, 'unsubscribe', subscriptions)
  }

  async reconcileSubscriptions(
    context: EndpointContext<SocketIOTransportTypes>,
    subscriptions: SubscriptionDeltas<TypeFromDefinition<SocketIOTransportTypes['Parameters']>>,
  ) {
    if (this.confirmedSubscriptions === undefined) {
      // Subscribe to get the current subscriptions in the response.
      await this.addSubscriptions(context, [])
    }
    if (this.confirmedSubscriptions === undefined) {
      logger.error('Unable to get current subscriptions')
      return
    }

    const desiredSubscriptions = new Set(
      subscriptions.desired.map((sub) => `${sub.base}/${sub.quote}`.toUpperCase()),
    )

    const toAdd = getSetDelta(desiredSubscriptions, this.confirmedSubscriptions)
    const toRemove = getSetDelta(this.confirmedSubscriptions, desiredSubscriptions)

    if (toAdd.length > 0 || toRemove.length > 0) {
      logger.info({
        msg: 'Changing subscriptions',
        subscriptions,
        confirmedSubscriptions: Array.from(this.confirmedSubscriptions),
        toAdd,
        toRemove,
      })
    }

    if (toAdd.length > 0) {
      // Avoid updating subscriptions in parallel to avoid a race condition
      // between responses updating confirmedSubscriptions.
      await this.addSubscriptions(context, toAdd)
    }

    if (toRemove.length > 0) {
      await this.removeSubscriptions(context, toRemove)
    }
  }

  async streamHandler(
    context: EndpointContext<SocketIOTransportTypes>,
    subscriptions: SubscriptionDeltas<TypeFromDefinition<SocketIOTransportTypes['Parameters']>>,
  ): Promise<void> {
    let providerDataStreamEstablishedTime: number

    if (this.socket === undefined) {
      logger.info('Establish connection')
      this.socket = this.establishWsConnection(config.settings)
      providerDataStreamEstablishedTime = Date.now()

      this.socket.on('connect', () => {
        logger.info({ msg: 'Connection open' })
        this.confirmedSubscriptions = new Set<string>()
      })

      this.socket.on('disconnect', (reason, details) => {
        logger.info({ msg: 'Connection closed', reason, details })
      })

      this.socket.on('connect_error', (error) => {
        if (this.socket?.active) {
          logger.info('temporary failure, the socket will automatically try to reconnect')
        } else {
          logger.error(error.message)
        }
      })

      this.socket.on('initial_token_states', (data) => {
        logger.debug('received initial data:', data)
        this.parseResponseData(providerDataStreamEstablishedTime, data)
      })

      this.socket.on('new_token_states', (data) => {
        this.parseResponseData(providerDataStreamEstablishedTime, data)
      })
    } else {
      // Await to avoid race conditions with future updates.
      await this.reconcileSubscriptions(context, subscriptions)
    }

    // The background execute loop no longer sleeps between executions, so we have to do it here
    logger.trace(
      `Socket handler complete, sleeping for ${context.adapterSettings.BACKGROUND_EXECUTE_MS_SSE}ms...`,
    )
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_SSE)

    return
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const socketioTransport = new SocketIOTransport()
