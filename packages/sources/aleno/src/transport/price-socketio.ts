import { io, Socket } from 'socket.io-client'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes } from '../endpoint/price'
import { config } from '../config'
import { ResponseSchema } from './price-http'

const logger = makeLogger('SocketIOTransport')

export type SocketIOTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

export class SocketIOTransport extends StreamingTransport<SocketIOTransportTypes> {
  socket?: Socket = undefined

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
    Object.values(data).forEach((row) => {
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

  async streamHandler(
    context: EndpointContext<SocketIOTransportTypes>,
    _: SubscriptionDeltas<TypeFromDefinition<SocketIOTransportTypes['Parameters']>>,
  ): Promise<void> {
    let providerDataStreamEstablishedTime: number

    if (this.socket === undefined) {
      logger.info('Establish connection')
      this.socket = this.establishWsConnection(config.settings)
      providerDataStreamEstablishedTime = Date.now()
    }

    this.socket.on('connect', () => {
      logger.info({ msg: 'Connection open' })
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
      logger.info('received initial data:')
      this.parseResponseData(providerDataStreamEstablishedTime, data)
    })

    this.socket.on('new_token_states', (data) => {
      this.parseResponseData(providerDataStreamEstablishedTime, data)
    })

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
