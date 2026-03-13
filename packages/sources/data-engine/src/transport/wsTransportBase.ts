import { decodeReport, generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  TransportGenerics,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { DECIMALS, scaleDecimals } from './utils'

// Re-export for backward compatibility (used by transport files and tests)
export { DECIMALS, scaleDecimals } from './utils'

type ProviderTypes = {
  Provider: {
    WsMessage: {
      report?: {
        feedID: string
        fullReport: string
      }
    }
  }
}

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
}

const buildWsUrl = (baseUrl: string, desiredSubs: { feedId?: string }[]) => {
  const url = new URL(`${baseUrl}/api/v1/ws`)

  if (desiredSubs) {
    // Deduplicate and sort feed IDs for a deterministic URL across background cycles
    const feedIds = desiredSubs
      .map((s) => s.feedId?.toLowerCase())
      .filter((id, i, arr): id is string => !!id && arr.indexOf(id) === i)
      .sort()
    url.searchParams.set('feedIDs', feedIds.join(','))
  }
  return url.toString()
}

export function createDataEngineTransport<
  BaseEndpointTypes extends BaseTransportTypes,
  DecodedReport,
>(config: {
  schemaVersion: string
  loggerName: string
  extractData: (decoded: DecodedReport) => BaseEndpointTypes['Response']['Data']
}) {
  const logger = makeLogger(config.loggerName)

  // Tracks the current set of subscriptions so the message handler can build
  // one cache entry per unique subscription. Updated by the url callback on
  // each background cycle.
  let currentDesiredSubs: Record<string, unknown>[] = []

  // Caches the latest decoded data per feedId. When a new subscription variant
  // (e.g. with resultPath/decimals) arrives after the WS message for its
  // feedId, the next incoming message for ANY feedId will still produce a cache
  // entry for it by looking up the data here.
  const latestDataByFeedId: Record<string, BaseEndpointTypes['Response']['Data']> = {}

  return new WebSocketTransport<BaseEndpointTypes & ProviderTypes>({
    url: (context, desiredSubs) => {
      currentDesiredSubs = desiredSubs as Record<string, unknown>[]
      return buildWsUrl(context.adapterSettings.WS_API_ENDPOINT, desiredSubs)
    },

    options: (context, desiredSubs) => {
      const url = buildWsUrl(context.adapterSettings.WS_API_ENDPOINT, desiredSubs)
      return {
        headers: generateAuthHeaders(
          context.adapterSettings.API_USERNAME,
          context.adapterSettings.API_PASSWORD,
          'GET',
          url.toString(),
        ),
        followRedirects: true,
      }
    },

    handlers: {
      error: (errorEvent) => {
        logger.error({ errorEvent }, 'websocket error')
      },

      message: (msg): ProviderResult<BaseEndpointTypes & ProviderTypes>[] | undefined => {
        if (!msg?.report?.fullReport || !msg?.report?.feedID) {
          return
        }

        const decoded = decodeReport(msg.report.fullReport, msg.report.feedID)

        if (decoded?.version.toUpperCase() !== config.schemaVersion.toUpperCase()) {
          return [
            {
              params: { feedId: msg.report.feedID } as any,
              response: {
                statusCode: 400,
                errorMessage: `${decoded?.version.toUpperCase()} schema from ${
                  msg.report.feedID
                } is not supported`,
              },
            },
          ]
        }

        // Cache decoded data so late-arriving subscription variants can be served
        latestDataByFeedId[msg.report.feedID] = config.extractData(decoded as DecodedReport)

        // Build one result per subscription that has cached data
        const results: ProviderResult<BaseEndpointTypes & ProviderTypes>[] = []
        for (const sub of currentDesiredSubs) {
          const feedId = sub.feedId as string
          const cachedData = latestDataByFeedId[feedId]
          if (!cachedData) continue

          const resultPath = sub.resultPath as string | undefined
          const decimals = sub.decimals as number | undefined

          let result: string | null = null
          if (resultPath) {
            const raw = (cachedData as Record<string, unknown>)[resultPath]
            if (raw !== undefined) {
              result = String(raw)
              if (decimals !== undefined) {
                result = scaleDecimals(result, DECIMALS, decimals)
              }
            }
          }

          results.push({
            params: sub as any,
            response: { result, data: cachedData },
          })
        }
        return results
      },

      close: (closeEvent) => {
        const { code, reason, wasClean } = closeEvent
        logger.info({ code, reason, wasClean }, 'websocket closed')
      },
    },
  })
}
