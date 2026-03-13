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

interface DesiredSub {
  feedId: string
  resultPath?: string
  decimals?: number
}

const buildWsUrl = (baseUrl: string, desiredSubs: Record<string, unknown>[]) => {
  const url = new URL(`${baseUrl}/api/v1/ws`)

  if (desiredSubs) {
    const rawIds = desiredSubs.map((s) => (s.feedId as string | undefined)?.toLowerCase())
    const feedIds = [...new Set(rawIds.filter((id): id is string => !!id))].sort()
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
  let currentDesiredSubs: DesiredSub[] = []

  return new WebSocketTransport<BaseEndpointTypes & ProviderTypes>({
    url: (context, desiredSubs) => {
      currentDesiredSubs = desiredSubs as unknown as DesiredSub[]
      return buildWsUrl(
        context.adapterSettings.WS_API_ENDPOINT,
        desiredSubs as unknown as Record<string, unknown>[],
      )
    },

    options: (context, desiredSubs) => {
      const url = buildWsUrl(
        context.adapterSettings.WS_API_ENDPOINT,
        desiredSubs as unknown as Record<string, unknown>[],
      )
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

        const data = config.extractData(decoded as DecodedReport)

        // Build one result per subscription that matches this message's feedId
        const results: ProviderResult<BaseEndpointTypes & ProviderTypes>[] = []
        for (const sub of currentDesiredSubs) {
          if (sub.feedId !== msg.report.feedID) continue

          let result: string | null = null
          if (sub.resultPath) {
            const raw = (data as Record<string, unknown>)[sub.resultPath]
            if (raw !== undefined) {
              result = String(raw)
              if (sub.decimals !== undefined) {
                result = scaleDecimals(result, DECIMALS, sub.decimals)
              }
            }
          }

          results.push({
            params: sub as any,
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
