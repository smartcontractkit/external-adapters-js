import { decodeReport, generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  TransportGenerics,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { commonInputParams } from '../endpoint/common'
import { resolveResult } from './utils'

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

type DesiredSub = TypeFromDefinition<typeof commonInputParams>

const buildWsUrl = (baseUrl: string, desiredSubs: DesiredSub[]) => {
  const url = new URL(`${baseUrl}/api/v1/ws`)

  if (desiredSubs) {
    const feedIds = [
      ...new Set(desiredSubs.filter((s) => s.feedId).map((s) => s.feedId.toLowerCase())),
    ].sort()
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
      const subs = desiredSubs as DesiredSub[]
      currentDesiredSubs = subs
      return buildWsUrl(context.adapterSettings.WS_API_ENDPOINT, subs)
    },

    options: (context, desiredSubs) => {
      const url = buildWsUrl(context.adapterSettings.WS_API_ENDPOINT, desiredSubs as DesiredSub[])
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
              params: { feedId: msg.report.feedID } as DesiredSub,
              response: {
                statusCode: 400,
                errorMessage: `${decoded?.version.toUpperCase()} schema from ${
                  msg.report.feedID
                } is not supported`,
              },
            },
          ] as ProviderResult<BaseEndpointTypes & ProviderTypes>[]
        }

        const data = config.extractData(decoded as DecodedReport)

        // Build one result per subscription that matches this message's feedId
        return currentDesiredSubs
          .filter((sub) => sub.feedId === msg.report!.feedID)
          .map((sub) => {
            const params = sub as ProviderResult<BaseEndpointTypes & ProviderTypes>['params']
            try {
              return {
                params,
                response: {
                  result: resolveResult(
                    data as Record<string, unknown>,
                    sub.resultPath,
                    sub.decimals,
                  ),
                  data,
                },
              }
            } catch (e) {
              return {
                params,
                response: {
                  statusCode: 400,
                  errorMessage: (e as Error).message,
                },
              }
            }
          })
      },

      close: (closeEvent) => {
        const { code, reason, wasClean } = closeEvent
        logger.info({ code, reason, wasClean }, 'websocket closed')
      },
    },
  })
}
