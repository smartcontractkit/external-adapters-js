import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { tz } from '@date-fns/tz'
import { isValid, parseISO, startOfDay } from 'date-fns'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/cme_futures'
import { BasePriceData, LoTechWebSocketTransport, LoTechWSResponse } from './common'

export type PriceData = BasePriceData & {
  symbol: string
  generic_symbol: string
  ingress_ts: number // microseconds
  publish_ts: null
  transaction_ts: number // microseconds
  price: number
  spread: number
  expiry_date: string
  roll_date: string
}

export type WSResponse = LoTechWSResponse<PriceData>

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

// Standard month codes used in futures contracts.
// See https://www.cmegroup.com/month-codes.html
const monthCodes = 'FGHJKMNQUVXZ'

export const getContractMonthFromSymbol = (symbol: string): number => {
  if (!symbol || symbol.length < 2) {
    throw new AdapterError({
      statusCode: 502,
      message: `Symbol must be at least 2 characters long. Received: '${symbol}'`,
    })
  }
  const monthCode = symbol.at(-2)!
  if (!monthCodes.includes(monthCode)) {
    throw new AdapterError({
      statusCode: 502,
      message: `Second to last character of symbol must be a valid month code. Received: '${symbol}'`,
    })
  }

  return 1 + monthCodes.indexOf(monthCode)
}

export const getRollDateTimestampSeconds = (
  rollDate: string,
  settings: typeof config.settings,
): number => {
  const timezone = tz(settings.ROLL_DATE_TIMEZONE)
  const date = parseISO(rollDate, { in: timezone })
  if (!isValid(date)) {
    throw new AdapterError({
      statusCode: 502,
      message: `Invalid roll date from data provider: '${rollDate}'`,
    })
  }
  return startOfDay(date).getTime() / 1000 + settings.ROLL_DATE_TIME_SECONDS
}

export class CmeFuturesWebSocketTransport extends LoTechWebSocketTransport<
  PriceData,
  BaseEndpointTypes['Response']['Data']
> {
  constructor() {
    super({
      url: (context) => context.adapterSettings.FUTURES_WS_API_ENDPOINT!,
      apiKey: (context) => context.adapterSettings.FUTURES_API_KEY!,
      getParamsSymbolFromWsData: (data) => data.generic_symbol,
      toResponseData: (data, context) => {
        const { price, spread, symbol, generic_symbol, expiry_date, roll_date, ingress_ts } = data

        const mid_price = price
        const bid_price = mid_price - spread / 2
        const ask_price = mid_price + spread / 2

        const contract_month = getContractMonthFromSymbol(symbol)

        return {
          mid_price,
          bid_price,
          ask_price,
          bid_volume: 0,
          ask_volume: 0,
          roll_date: getRollDateTimestampSeconds(roll_date, context.adapterSettings),
          symbol,
          generic_symbol,
          expiry_date,
          contract_month,
          ingress_ts_iso: new Date(ingress_ts / 1000).toISOString(),
        }
      },
    })
  }
}

export const cmeFuturesTransport = new CmeFuturesWebSocketTransport()
