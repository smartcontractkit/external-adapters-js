import { DecodedV3Report, decodeReport, generateAuthHeaders } from '@chainlink/data-streams-sdk'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/crypto-lwba'

const logger = makeLogger('DataEngine Crypto LWBA WS')

type DataEngineReportMsg = {
  report?: {
    feedID: string
    fullReport: string
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: DataEngineReportMsg
  }
}

const SCALE = 10n ** 18n

const buildWsUrl = (baseUrl: string, desiredSubs?: Array<{ feedId: string }>): URL => {
  const url = new URL(`${baseUrl}/api/v1/ws`)
  if (desiredSubs && desiredSubs.length) {
    const feedIds = [...new Set(desiredSubs.map((s) => s.feedId.toLowerCase()))].sort().join(',')
    url.searchParams.set('feedIDs', feedIds)
  }
  return url
}

export const dataEngineWs = new WebSocketTransport<WsTransportTypes>({
  url: (context, desiredSubs) =>
    buildWsUrl(context.adapterSettings.DATA_ENGINE_WS_URL, desiredSubs).toString(),

  options: (context, desiredSubs) => {
    const url = buildWsUrl(context.adapterSettings.DATA_ENGINE_WS_URL, desiredSubs)

    return {
      headers: generateAuthHeaders(
        context.adapterSettings.DATA_ENGINE_USER_ID,
        context.adapterSettings.DATA_ENGINE_USER_SECRET,
        'GET',
        url.toString(),
      ),
      followRedirects: true,
    }
  },

  handlers: {
    error: (errorEvent) => {
      logger.error({ errorEvent }, 'LWBA websocket error')
    },

    message: (msg): ProviderResult<WsTransportTypes>[] | undefined => {
      const report = (msg as DataEngineReportMsg)?.report
      if (!report?.fullReport || !report?.feedID) {
        return
      }

      // Decode the LWBA report (bid/ask scaled by 1e18)
      const decoded = decodeReport(report.fullReport, report.feedID) as DecodedV3Report
      const bidRaw = decoded?.bid as bigint
      const askRaw = decoded?.ask as bigint
      const feedId = report.feedID
      // TODO: Is this correct? or should we set mid to avg(bid,ask)
      const midRaw = decoded?.price as bigint

      if (typeof bidRaw !== 'bigint' || typeof askRaw !== 'bigint') {
        logger.warn(
          { feedID: report.feedID, decodedKeys: Object.keys(decoded || {}) },
          'Unexpected decoded report shape',
        )
        return
      }

      const bid = bigintPriceToFloat(bidRaw)
      const ask = bigintPriceToFloat(askRaw)
      const mid = bigintPriceToFloat(midRaw)
      // const mid = (bid + ask) / 2

      return [
        {
          params: {
            feedId,
          },
          response: {
            result: null,
            data: {
              bid: bid,
              mid: mid,
              ask: ask,
            },
          },
        },
      ]
    },

    close: (closeEvent) => {
      const { code, reason, wasClean } = closeEvent as any
      logger.info({ code, reason, wasClean }, 'LWBA websocket closed')
    },
  },
})

const bigintPriceToFloat = (x: bigint): number => {
  const int = x / SCALE
  const frac = x % SCALE
  return Number(int) + Number(frac) / 1e18
}
