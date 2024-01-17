import { config as adapterSettings } from '../config'

export interface EtfMessage {
  s: string
  p: string
  dc: string
  dd: string
  t: number
}

export interface EtfResponseSchema {
  symbol: string
  price: number
  timestamp: number
  error?: string
}

export function makeEtfHttpRequest<T>(
  config: typeof adapterSettings.settings,
  param: T,
  symbol: string,
  country: string | undefined,
) {
  return {
    params: [param],
    request: {
      baseURL: config.API_ENDPOINT,
      url: `/last/etf/${symbol}`,
      params: { apikey: config.API_KEY, country: country },
    },
  }
}

export function makeEtfHttpResponse<T>(params: T[], price: number, timestamp: number) {
  return params.map((param) => {
    return {
      params: param,
      response: {
        data: {
          result: price,
        },
        result: price,
        timestamps: {
          providerIndicatedTimeUnixMs: timestamp,
        },
      },
    }
  })
}

export function makeEtfHttpError<T>(params: T[]) {
  return params.map((param) => {
    return {
      params: param,
      response: {
        errorMessage:
          "Could not retrieve valid data from Data Provider's /last/etf API. This is likely an issue with the Data Provider or the input params/overrides",
        statusCode: 400,
      },
    }
  })
}

export function makeEtfWsUrl(config: typeof adapterSettings.settings) {
  return `${config.ETF_WS_API_ENDPOINT}/?token=${config.WS_SOCKET_KEY}`
}

export function makeEtfWsMessage(action: 'subscribe' | 'unsubscribe', base: string) {
  return { action, symbols: base }
}

export function parseEtfWsMessage<T>(param: T | undefined, message: EtfMessage) {
  if (!param || (!message.s && !message.p && !message.t)) {
    return []
  }

  const result = Number(message.p)
  return [
    {
      params: param,
      response: {
        data: {
          result,
        },
        result,
        timestamps: {
          // convert seconds to milliseconds
          providerIndicatedTimeUnixMs: Number(message.t) * 1000,
        },
      },
    },
  ]
}
