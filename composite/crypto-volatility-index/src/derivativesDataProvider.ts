import { AdapterError, Requester, logger } from '@chainlink/external-adapter'
import moment from 'moment'
import { Decimal } from 'decimal.js'

const EXCHANGE_URL = `https://www.deribit.com/api/v2/public`
const currencyEndpoint = `${EXCHANGE_URL}/get_index`
const bookDataEndpoint = `${EXCHANGE_URL}/get_book_summary_by_currency`
const instrumentEndpoint = `${EXCHANGE_URL}/get_instruments`
const expirationHour = 8

export type DeribitOptionDataResponse = {
  instrument_name: string
  mid_price: string
  underlying_price: number
}

export type OptionData = {
  instrumentName: string
  strikePrice: Decimal
  midPrice: Decimal | undefined
  underlyingPrice: Decimal
  expiration: number
  type: string
}

export type CurrencyDerivativesData = {
  e1: number
  e2: number
  callsE1: Array<OptionData>
  callsE2: Array<OptionData>
  putsE1: Array<OptionData>
  putsE2: Array<OptionData>
  exchangeRate: Decimal
}

export type InstrumentData = {
  instrument_name: string
  creation_timestamp: number
}

export const getDerivativesData = async (
  cryptoCurrencies: Array<string>,
): Promise<Record<string, CurrencyDerivativesData>> => {
  const currencyValues = await Promise.all(
    cryptoCurrencies.map(async (currency: string) => {
      return await getCurrencyData(currency)
    }),
  )

  logger.debug('currencyValues:', currencyValues)
  const optionsData = await Promise.all(
    cryptoCurrencies.map(async (currency: string, index: number) => {
      return await getOptionsData(currency, new Decimal(currencyValues[index]))
    }),
  )
  // Return derivatives data mapped by currency
  return optionsData.reduce((obj: Record<string, CurrencyDerivativesData>, data, idx) => {
    obj[cryptoCurrencies[idx]] = data
    return obj
  }, {})
}

const getCurrencyData = async (currency: string) => {
  const config = {
    url: currencyEndpoint,
    params: { currency },
  }
  const response = await Requester.request(config)
  const path = ['result', currency]
  return Requester.validateResultNumber(response.data, path)
}

const getInstrumentData = async (currency: string) => {
  const config = {
    url: instrumentEndpoint,
    params: { currency },
  }
  const response = await Requester.request(config)
  return response.data.result
}

const olderThanHour = (
  instrumentName: string,
  hourAgo: number,
  instruments: Array<InstrumentData>,
): boolean => {
  for (const instrument of instruments) {
    if (instrument.instrument_name === instrumentName) {
      return hourAgo > instrument.creation_timestamp
    }
  }
  return false
}

const getOptionsData = async (currency: string, exchangeRate: Decimal) => {
  const config = {
    url: bookDataEndpoint,
    params: { currency, kind: 'option' },
  }

  try {
    const response = await Requester.request(config)
    const result = response.data.result
    const calls: Record<number, Array<OptionData>> = {}
    const puts: Record<number, Array<OptionData>> = {}
    const instruments: Array<InstrumentData> = await getInstrumentData(currency)
    const hourAgo = moment().utc().subtract(1, 'hours').unix() * 1000

    result.map(convertToOptionData).forEach((optionData: OptionData) => {
      const { instrumentName, expiration, type } = optionData
      if (
        olderThanHour(instrumentName, hourAgo, instruments) &&
        moment.unix(expiration).weekday() == 5
      ) {
        if (type === 'C') {
          if (!calls[expiration]) calls[expiration] = []
          calls[expiration].push(optionData)
        } else if (type === 'P') {
          if (!puts[expiration]) puts[expiration] = []
          puts[expiration].push(optionData)
        } else {
          throw new Error(`Invalid option type:${type}`)
        }
      }
    })

    const { e1, e2 } = findNearMonthExpirations(calls)

    logger.debug(`e1:${e1},e2:${e2}`)
    logger.debug(`exchangeRate:${exchangeRate}`)

    return {
      e1: e1 + expirationHour * 60 * 60,
      e2: e2 + expirationHour * 60 * 60,
      callsE1: calls[e1],
      callsE2: calls[e2],
      putsE1: puts[e1],
      putsE2: puts[e2],
      exchangeRate,
    }
  } catch (error) {
    logger.error(error)
    logger.error(error.stack)
    throw new AdapterError(error)
  }
}

function findNearMonthExpirations(calls: Record<number, Array<OptionData>>) {
  const e30 = moment().utc().add(30, 'days').subtract(expirationHour, 'hours').unix()
  let e1: number | undefined
  let e2: number | undefined

  // Find last expiration before a full month && first expiration after a full month
  Object.keys(calls).forEach((expirationDate) => {
    const e = +expirationDate
    if (e <= e30) {
      if (!e1 || e1 < e) {
        e1 = e
      }
    } else if (e > e30) {
      if (!e2 || e2 > e) {
        e2 = e
      }
    }
  })

  if (!e1) throw new Error('Could not find an expiration date before a full month')
  if (!e2) throw new Error('Could not find an expiration date after a full month')
  logger.debug(`e1:${e1} e2:${e2}`)
  return { e1, e2 }
}

function convertToOptionData(option: DeribitOptionDataResponse) {
  const { instrument_name, mid_price, underlying_price } = option
  const [, expiration, strikePrice, type] = instrument_name.split('-')
  const optionData: OptionData = {
    instrumentName: instrument_name,
    strikePrice: new Decimal(strikePrice),
    midPrice: mid_price ? new Decimal(mid_price) : undefined,
    underlyingPrice: new Decimal(underlying_price),
    expiration: moment.utc(expiration, 'DDMMMYY').unix(),
    type,
  }

  return optionData
}
