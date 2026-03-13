import { decodeReport, generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  TransportGenerics,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { fanOutResults } from './utils'

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
        return fanOutResults(msg.report.feedID, data, currentDesiredSubs)
      },

      close: (closeEvent) => {
        const { code, reason, wasClean } = closeEvent
        logger.info({ code, reason, wasClean }, 'websocket closed')
      },
    },
  })
}
