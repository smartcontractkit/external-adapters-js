import EventSource from 'eventsource'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import {
  makeLogger,
  sleep,
  PartialSuccessfulResponse,
  ProviderResult,
  ResponseTimestamps,
  TimestampedProviderResult,
} from '@chainlink/external-adapter-framework/util'
import {
  SSEConfig,
  TransportDependencies,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'

const logger = makeLogger('ModifiedSSETransport')

export class ModifiedSseTransport<T extends TransportGenerics> extends StreamingTransport<T> {
  EventSource: typeof EventSource = EventSource
  eventListeners!: {
    type: string
    parseResponse: (evt: MessageEvent) => ProviderResult<T>
  }[]
  sseConnection?: EventSource

  constructor(
    private config: {
      prepareSSEConnectionConfig: (
        subscriptions: SubscriptionDeltas<T['Request']['Params']>,
        context: EndpointContext<T>,
      ) => SSEConfig
      eventListeners: {
        type: string
        parseResponse: (evt: MessageEvent) => ProviderResult<T>[]
      }[]
    },
  ) {
    super()
  }

  getSubscriptionTtlFromConfig(config: AdapterConfig<T['CustomSettings']>): number {
    return config.SSE_SUBSCRIPTION_TTL
  }

  override async initialize(
    dependencies: TransportDependencies<T>,
    config: AdapterConfig<T['CustomSettings']>,
    endpointName: string,
  ): Promise<void> {
    super.initialize(dependencies, config, endpointName)
    if (dependencies.eventSource) {
      this.EventSource = dependencies.eventSource
    }
  }

  async streamHandler(
    context: EndpointContext<T>,
    subscriptions: SubscriptionDeltas<T['Request']['Params']>,
  ): Promise<void> {
    if (subscriptions.new.length || subscriptions.stale.length) {
      logger.debug('New subscriptions available, connecting to modified SSE')
      const sseConfig = this.config.prepareSSEConnectionConfig(subscriptions, context)
      const providerDataStreamEstablishedUnixMs = Date.now()

      this.sseConnection = new this.EventSource(sseConfig.url, sseConfig.eventSourceInitDict)

      const eventHandlerGenerator = (listener: typeof this.config.eventListeners[0]) => {
        return (e: MessageEvent) => {
          const providerDataReceivedUnixMs = Date.now()
          const results = listener.parseResponse(e).map((r) => {
            const partialResponse = r.response as PartialSuccessfulResponse<T['Response']>
            const result = r as TimestampedProviderResult<T>
            const timestamps = {
              providerDataStreamEstablishedUnixMs,
              providerDataReceivedUnixMs,
              providerIndicatedTimeUnixMs: partialResponse.timestamps?.providerIndicatedTime,
            } as unknown as ResponseTimestamps
            result.response.timestamps = timestamps
            return result
          })
          this.responseCache.write(results)
        }
      }

      this.config.eventListeners.forEach((listener) => {
        this.sseConnection?.addEventListener(listener.type, eventHandlerGenerator(listener))
      })
    }

    // The background execute loop no longer sleeps between executions, so we have to do it here
    logger.trace(
      `Modified SSE handler complete, sleeping for ${context.adapterConfig.BACKGROUND_EXECUTE_MS_SSE}ms...`,
    )
    await sleep(context.adapterConfig.BACKGROUND_EXECUTE_MS_SSE)

    return
  }
}
