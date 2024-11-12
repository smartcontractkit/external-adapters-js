import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  TransportDependencies,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import {
  makeLogger,
  PartialSuccessfulResponse,
  ProviderResult,
  sleep,
  TimestampedProviderResult,
} from '@chainlink/external-adapter-framework/util'

import axios from 'axios'
import { config } from '../config'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

const logger = makeLogger('ModifiedSSETransport')

export type ModifiedSSEConfig = {
  url: string
  config?: {
    responseType: 'stream'
    headers: { [header: string]: string }
  }
}

export class ModifiedSseTransport<T extends TransportGenerics> extends StreamingTransport<T> {
  eventListeners!: {
    type: string
    parseResponse: (eventt: MessageEvent<any>['data']) => ProviderResult<T>[]
  }[]

  constructor(
    private config: {
      prepareSSEConnectionConfig: (
        subscriptions: (string | undefined)[],
        context: EndpointContext<T>,
      ) => ModifiedSSEConfig
      eventListeners: {
        type: string
        parseResponse: (event: MessageEvent<any>['data']) => ProviderResult<T>[]
      }[]
      parseSubscriptionList: (
        subscriptions: TypeFromDefinition<T['Parameters']>[],
        context: EndpointContext<T>,
      ) => Promise<(string | undefined)[]>
    },
  ) {
    super()
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.SSE_SUBSCRIPTION_TTL
  }

  override async initialize(
    dependencies: TransportDependencies<T>,
    settings: typeof config.settings,
    endpointName: string,
    name: string,
  ): Promise<void> {
    super.initialize(dependencies, settings, endpointName, name)
  }

  async streamHandler(
    context: EndpointContext<T>,
    subscriptions: SubscriptionDeltas<TypeFromDefinition<T['Parameters']>>,
  ): Promise<void> {
    if (subscriptions.new.length || subscriptions.stale.length) {
      logger.info({ msg: 'Updating SSE subscriptions', subscriptions })

      const subsList = await this.config.parseSubscriptionList(subscriptions.desired, context)

      logger.info({ subsList })

      if (subsList.some((s) => !s)) {
        logger.error({ msg: `Cannot update SSE subscriptions, subscriptions contains invalid sub` })
      } else {
        const sseConfig = this.config.prepareSSEConnectionConfig(subsList as string[], context)

        const providerDataStreamEstablishedUnixMs = Date.now()

        const restartStream = async () => {
          const response = await axios.get(sseConfig.url, sseConfig.config)

          const stream = response?.data

          const eventHandlerGenerator = (listener: (typeof this.config.eventListeners)[0]) => {
            return (event: MessageEvent) => {
              const providerDataReceivedUnixMs = Date.now()

              const results = listener.parseResponse(event).map((r) => {
                const partialResponse = r.response as PartialSuccessfulResponse<T['Response']>
                const result = r as TimestampedProviderResult<T>
                result.response.timestamps = {
                  providerDataStreamEstablishedUnixMs,
                  providerDataReceivedUnixMs,
                  providerIndicatedTimeUnixMs:
                    partialResponse.timestamps?.providerIndicatedTimeUnixMs,
                }
                return result
              })
              this.responseCache.write('sse', results)
            }
          }

          const eventHandlers = this.config.eventListeners.reduce(
            (handlers: { [type: string]: any }, listener) => {
              handlers[listener.type] = eventHandlerGenerator(listener)
              return handlers
            },
            {},
          )

          stream.on('open', () => {
            logger.info({ msg: 'Stream open' })
          })

          stream.on('close', () => {
            logger.info({ msg: 'Stream closed, restarting' })
            restartStream()
          })

          stream.on('end', () => {
            logger.info({ msg: 'Stream ended, restarting' })
            restartStream()
          })

          stream.on('error', (error: any) => {
            logger.error({ msg: 'Stream error occurred', error })
            restartStream()
          })

          stream.on('data', (data: any) => {
            logger.debug({ msg: 'Stream data received', data })
            try {
              let chunkBuffer = ''
              data
                .toString()
                .split('\n')
                .map((record: string) => {
                  record = record.trim()
                  if (!record) return
                  if (chunkBuffer) {
                    if (chunkBuffer.startsWith('{')) {
                      record = chunkBuffer + record
                    }
                    chunkBuffer = ''
                  }
                  try {
                    const item = JSON.parse(record)
                    if (eventHandlers[item.type]) eventHandlers[item.type](item)
                  } catch (e) {
                    chunkBuffer += record
                  }
                })
            } catch (error) {
              logger.error({ msg: 'Failed to process a message', error })
            }
          })
        }

        await restartStream()
      }
    }

    // The background execute loop no longer sleeps between executions, so we have to do it here
    logger.trace(
      `Modified SSE handler complete, sleeping for ${context.adapterSettings.BACKGROUND_EXECUTE_MS_SSE}ms...`,
    )
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_SSE)

    return
  }
}
