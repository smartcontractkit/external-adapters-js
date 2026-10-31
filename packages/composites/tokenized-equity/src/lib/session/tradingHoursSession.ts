import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TZDate } from '@date-fns/tz'
import type { SessionEvent } from './types'

type SessionResponse = {
  data: {
    result: {
      status: TwentyfourFiveMarketStatus
      statusString: string
      time: string
    }[]
  }
  statusCode: number
}

type MarketStatusResponse = {
  data: {
    result: TwentyfourFiveMarketStatus
    statusString: string
  }
  statusCode: number
}

/**
 * Fetches every scheduled session start from the tradinghours EA, including
 * REGULAR and Sunday overnight. Callers decide which events are relevant for
 * smoothing, so the gate can use the full schedule.
 */
export const getSessions = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundariesTimeZone: string,
  sessionMarket: string,
  sessionMarketType: string,
): Promise<SessionEvent[]> => {
  const requestConfig = {
    baseURL: tradingHoursUrl,
    method: 'POST',
    data: {
      data: {
        endpoint: 'market-session',
        market: sessionMarket,
        type: sessionMarketType,
        timezone: sessionBoundariesTimeZone,
      },
    },
  }

  try {
    const response = await requester.request<SessionResponse>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    const data = response?.response?.data
    if (!data || !data?.data?.result) {
      throw new AdapterError({
        statusCode: data?.statusCode || 500,
        message: `TradingHours EA request failed: ${JSON.stringify(response?.response?.data)} ${
          response?.response?.status
        } ${response?.response?.statusText}`,
      })
    }
    return processData(data.data.result, sessionBoundariesTimeZone)
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `TradingHoursEA request failed: ${e.message} ${
        JSON.stringify(e?.errorResponse) || e.name
      }`
    }
    throw e
  }
}

/**
 * Fetches the session that should be open now. The tradinghours endpoint maps
 * the market's current phase to a 24/5 status and applies the weekend window,
 * so this is also the source of WEEKEND/closure detection.
 */
export const getMarketStatus = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionMarket: string,
  sessionMarketType: string,
  weekend: string,
): Promise<TwentyfourFiveMarketStatus> => {
  const requestConfig = {
    baseURL: tradingHoursUrl,
    method: 'POST',
    data: {
      data: {
        endpoint: 'market-status',
        market: sessionMarket,
        type: sessionMarketType,
        weekend,
      },
    },
  }

  try {
    const response = await requester.request<MarketStatusResponse>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    const data = response?.response?.data
    if (
      data?.data?.result === undefined ||
      data?.data?.result === null ||
      typeof data.data.result !== 'number'
    ) {
      throw new AdapterError({
        statusCode: data?.statusCode || 500,
        message: `TradingHours EA market-status request failed: ${JSON.stringify(
          response?.response?.data,
        )} ${response?.response?.status} ${response?.response?.statusText}`,
      })
    }
    return data.data.result
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `TradingHoursEA market-status request failed: ${e.message} ${
        JSON.stringify(e?.errorResponse) || e.name
      }`
    }
    throw e
  }
}

const processData = (data: SessionResponse['data']['result'], timezone: string): SessionEvent[] =>
  data
    .filter((d) => d.status !== TwentyfourFiveMarketStatus.UNKNOWN)
    .map((d) => ({
      status: d.status,
      startMs: new TZDate(d.time, timezone).getTime(),
    }))
    .sort((a, b) => a.startMs - b.startMs)
