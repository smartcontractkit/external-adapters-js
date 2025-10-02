import {
  createClient,
  DataStreamsClient,
  DecodedV3Report,
  decodeReport,
  LogLevel,
} from '@chainlink/data-streams-sdk'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/crypto-lwba'

const logger = makeLogger('DataEngineTransport')

const DS_DECIMALS = 18n
const DS_SCALE = 10n ** DS_DECIMALS
type RequestParams = typeof inputParameters.validated

export type CustomTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

export class CustomTransport extends SubscriptionTransport<CustomTransportTypes> {
  name!: string
  responseCache!: ResponseCache<CustomTransportTypes>
  requester!: Requester
  client!: DataStreamsClient
  async initialize(
    dependencies: TransportDependencies<CustomTransportTypes>,
    adapterSettings: CustomTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.client = createClient({
      apiKey: adapterSettings.DATA_ENGINE_USER_ID,
      userSecret: adapterSettings.DATA_ENGINE_USER_SECRET,
      endpoint: adapterSettings.DATA_ENGINE_BASE_URL,
      wsEndpoint: adapterSettings.DATA_ENGINE_WS_URL,
      logging: { logger, logLevel: LogLevel.INFO },
    })
  }
  // 'backgroundHandler' is called on each background execution iteration. It receives endpoint context as first argument
  // and an array of all the entries in the subscription set as second argument. Use this method to handle the incoming
  // request, process it and save it in the cache.
  async backgroundHandler(
    context: EndpointContext<CustomTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<CustomTransportTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const started = Date.now()
    const feedIds: string[] = param.feedIds

    // Track desired feeds
    let needResub = false
    for (const id of feedIds) {
      if (!this.subscribed.has(id)) {
        this.wanted.add(id)
        needResub = true
      }
    }
    if (needResub) await this.openOrResubscribe([...this.wanted])

    // Build response from cache; fallback to single REST fetch if not present yet
    const result: ResultRow[] = await Promise.all(
      feedIds.map(async (id) => {
        const cached = this.latest.get(id)
        if (cached) return cached

        // cold start fallback (optional, avoids empty first response)
        try {
          const rep = await this.client.getLatestReport(id)
          const dec = decodeReport(rep.fullReport, rep.feedID) as DecodedV3Report

          const toStr = (x?: bigint) =>
            x == null ? undefined : (Number(x) / Number(DS_SCALE)).toString()

          const price = (dec as any).price as bigint | undefined
          const bid = (dec as any).bid as bigint | undefined
          const ask = (dec as any).ask as bigint | undefined

          const row: ResultRow = {
            feedId: rep.feedID,
            price: price != null ? toStr(price) : undefined,
            bid: bid != null ? toStr(bid) : price != null ? toStr(price) : undefined,
            ask: ask != null ? toStr(ask) : price != null ? toStr(price) : undefined,
            updatedAt: Number((dec as any).observationsTimestamp ?? Date.now() / 1000),
          }
          this.latest.set(rep.feedID, row)
          return row
        } catch (e: any) {
          logger.error(e, `Cold fetch failed for ${id}`)
          return { feedId: id, error: e?.message ?? 'unavailable' }
        }
      }),
    )
    return {
      data: {
        result,
      },
      statusCode: 200,
      result: 2000,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }
  private async openOrResubscribe(newOnes: string[]) {
    if (this.connecting) return
    this.connecting = true
    try {
      // Union the new feedIds
      newOnes.forEach((id) => this.subscribed.add(id))
      this.wanted.clear()

      // (Re)open WS with the full set
      await this.client.closeWebSocket?.().catch(() => {}) // optional if SDK exposes it
      await this.client.openWebSocket({
        feedIDs: [...this.subscribed],
        // Called on every verified report
        onReport: (msg: { report: { feedID: string; fullReport: string } }) => {
          const { feedID, fullReport } = msg.report
          try {
            const dec = decodeReport(fullReport, feedID) as DecodedV3Report

            const toStr = (x?: bigint) =>
              x == null ? undefined : (Number(x) / Number(DS_SCALE)).toString()

            const price = (dec as any).price as bigint | undefined
            const bid = (dec as any).bid as bigint | undefined
            const ask = (dec as any).ask as bigint | undefined

            const row: ResultRow = {
              feedId: feedID,
              price: price != null ? toStr(price) : undefined,
              bid: bid != null ? toStr(bid) : price != null ? toStr(price) : undefined,
              ask: ask != null ? toStr(ask) : price != null ? toStr(price) : undefined,
              updatedAt: Number((dec as any).observationsTimestamp ?? Date.now() / 1000),
            }
            this.latest.set(feedID, row)
          } catch (e: any) {
            logger.error(e, `Decode error for ${feedID}`)
          }
        },
        onOpen: () => {
          this.wsConnected = true
          logger.info(`Data Streams WS connected (${this.subscribed.size} feeds)`)
        },
        onClose: (code?: number, reason?: string) => {
          this.wsConnected = false
          logger.error(`Data Streams WS closed: code=${code} reason=${reason || ''}`)
          // Retry with backoff
          setTimeout(() => this.openOrResubscribe([]).catch(() => {}), 1_000)
        },
        onError: (err: any) => {
          logger.error(err, 'Data Streams WS error')
        },
      })
    } finally {
      this.connecting = false
    }
  }
  getSubscriptionTtlFromConfig(adapterSettings: CustomTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const customSubscriptionTransport = new CustomTransport()
