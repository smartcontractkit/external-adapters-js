import { decodeReport } from '@chainlink/data-streams-sdk'
import { generateAuthHeaders } from '@chainlink/data-streams-sdk/utils'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'

const DS_DECIMALS = 18
const SCALE = 10 ** DS_DECIMALS

export const dataEngineWs = new WebSocketTransport({
  url: (ctx, params) => `${process.env.DATA_ENGINE_WS_URL}/api/v1/ws?feedIDs=${params.feedId}`,

  handlers: {
    url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/stream?format=proto`,
    error: (errorEvent) => {
      logger.error({ errorEvent }, 'LWBA websocket error')
    },

    options: async (context) => ({
      headers: generateAuthHeaders(
        context.DATA_ENGINE_USER_ID,
        context.DATA_ENGINE_USER_SECRET,
        'GET',
        context.DATA_ENGINE_WS_URL,
      ),
      followRedirects: true,
    }),
    message: (msg, ctx, params) => {
      const { feedID, fullReport } = msg.report
      const d = decodeReport(fullReport, feedID) as any
      const price = (d.bid ?? d.price) / SCALE
      const ask = (d.ask ?? d.price) / SCALE
      return {
        result: (price + ask) / 2,
        data: {
          base: params.base,
          quote: params.quote ?? 'USD',
          bid: Math.min(price, ask),
          ask: Math.max(price, ask),
        },
        statusCode: 200,
      }
    },
    close: (closeEvent) => {
      const code = (closeEvent as any)?.code
      const reason = (closeEvent as any)?.reason
      const wasClean = (closeEvent as any)?.wasClean
      logger.info({ code, reason, wasClean }, 'LWBA websocket closed')
    },
  },
  builders: {
    subscribeMessage: () => {
      return undefined
    },

    unsubscribeMessage: (p: { market: string; isin: string }) => {
      return undefined
    },
  },
  // beware: this pattern opens a socket per request key
})
