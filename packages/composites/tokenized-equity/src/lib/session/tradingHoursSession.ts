import {
  MarketStatusResultResponse,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TZDate } from '@date-fns/tz'

type Response = {
  data: {
    result: {
      status: MarketStatusResultResponse['Result']
      statusString: string
      time: string
    }[]
  }
  statusCode: number
}

export const getSessions = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundariesTimeZone: string,
  sessionMarket: string,
  sessionMarketType: string,
): Promise<number[]> => {
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
    const response = await requester.request<Response>(JSON.stringify(requestConfig), requestConfig)

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

const processData = (data: Response['data']['result'], timezone: string): number[] =>
  data
    .filter(
      (d) =>
        d.status === TwentyfourFiveMarketStatus.PRE_MARKET ||
        d.status === TwentyfourFiveMarketStatus.POST_MARKET ||
        d.status === TwentyfourFiveMarketStatus.OVERNIGHT,
    )
    .map((d) => ({ status: d.status, time: new TZDate(d.time, timezone) }))
    .filter(
      (d) =>
        // Skip Sunday Overnight because we don't want to use stale weekend data to smooth
        !(d.status === TwentyfourFiveMarketStatus.OVERNIGHT && d.time.getDay() === 0),
    )
    .map((d) => d.time.getTime())
