import { decodeReport, generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  TransportGenerics,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import Decimal from 'decimal.js'
import { config } from '../config'

export const DECIMALS = 18

/**
 * Scales a raw integer string from `fromDecimals` to `toDecimals`.
 * Uses truncation (floor toward zero) when scaling down.
 */
export function scaleDecimals(value: string, fromDecimals: number, toDecimals: number): string {
  if (fromDecimals === toDecimals) {
    return value
  }
  const diff = fromDecimals - toDecimals
  const raw = new Decimal(value)
  const scaled = raw.div(new Decimal(10).pow(diff))
  return scaled.toFixed(0, Decimal.ROUND_DOWN)
}

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
    const uniqueFeedIds: string[] = []
    for (const s of desiredSubs) {
      if (s.feedId) {
        const lower = s.feedId.toLowerCase()
        if (!uniqueFeedIds.includes(lower)) {
          uniqueFeedIds.push(lower)
        }
      }
    }
    uniqueFeedIds.sort()
    url.searchParams.set('feedIDs', uniqueFeedIds.join(','))
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

  // Capture desiredSubs from the url callback so the message handler can fan out
  // results per unique subscription (including resultPath/decimals variants).
  // The url callback is invoked every BACKGROUND_EXECUTE_MS_WS (~1s by default).
  let currentDesiredSubs: Record<string, unknown>[] = []

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
              params: {
                feedId: msg.report.feedID,
              } as any,
              response: {
                statusCode: 400,
                errorMessage: `${decoded?.version.toUpperCase()} schema from ${
                  msg.report.feedID
                } is not supported`,
              },
            },
          ]
        }

        const data = config.extractData(decoded as DecodedReport)
        const feedId = msg.report.feedID

        // Find all subscriptions matching this feedID
        const matchingSubs = currentDesiredSubs.filter((s) => s.feedId === feedId)

        if (matchingSubs.length === 0) {
          // Fallback: desiredSubs not populated yet (before first url callback)
          return [
            {
              params: { feedId } as any,
              response: { result: null, data },
            },
          ]
        }

        // De-duplicate and fan out one ProviderResult per unique subscription.
        // Build a clean params object so the cache key matches the incoming request exactly.
        // Uses an array (not Set) for deterministic iteration order.
        const seen: string[] = []
        const results: ProviderResult<BaseEndpointTypes & ProviderTypes>[] = []

        for (const sub of matchingSubs) {
          const resultPath = sub.resultPath as string | undefined
          const decimals = sub.decimals as number | undefined

          // Build params with only defined fields to ensure cache key match
          const params: Record<string, unknown> = { feedId }
          if (resultPath !== undefined) params.resultPath = resultPath
          if (decimals !== undefined) params.decimals = decimals

          const key = JSON.stringify(params)
          if (seen.includes(key)) continue
          seen.push(key)

          let result: string | null = null
          if (resultPath) {
            const raw = (data as Record<string, unknown>)[resultPath]
            if (raw !== undefined) {
              result = String(raw)
              if (decimals !== undefined) {
                result = scaleDecimals(result, DECIMALS, decimals)
              }
            }
          }

          results.push({
            params: params as any,
            response: { result, data },
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
