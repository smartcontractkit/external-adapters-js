import { AdapterError, Requester, logger } from '@chainlink/external-adapter'
import moment from 'moment'
import { Big } from 'big.js'

const EXCHANGE_URL = `https://www.deribit.com/api/v2/public`
const currencyEndpoint = `${EXCHANGE_URL}/get_index`
const bookDataEndpoint = `${EXCHANGE_URL}/get_book_summary_by_currency`

const DATE_FORMAT = 'DDMMYYYY'

export type DeribitOptionDataResponse = {
  instrument_name: string
  mid_price: string
  underlying_price: number
}

export type OptionData = {
  strikePrice: Big
  midPrice: Big | undefined
  underlyingPrice: Big
  expiration: moment.Moment
  type: string
}

export type CurrencyDerivativesData = {
  e1: moment.Moment
  e2: moment.Moment
  callsE1: Array<OptionData>
  callsE2: Array<OptionData>
  putsE1: Array<OptionData>
  putsE2: Array<OptionData>
  exchangeRate: Big
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
      return await getOptionsData(currency, currencyValues[index])
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

const getOptionsData = async (currency: string, exchangeRate: Big) => {
  const config = {
    url: bookDataEndpoint,
    params: { currency, kind: 'option' },
  }

  try {
    const response = await Requester.request(config)
    const result = response.data.result
    const calls: Record<string, Array<OptionData>> = {}
    const puts: Record<string, Array<OptionData>> = {}

    result.map(convertToOptionData).forEach((optionData: OptionData) => {
      const { expiration, type } = optionData
      const expirationDate = moment(expiration, 'DDMMMYY').format(DATE_FORMAT)
      if (type === 'C') {
        if (!calls[expirationDate]) calls[expirationDate] = []
        calls[expirationDate].push(optionData)
      } else if (type === 'P') {
        if (!puts[expirationDate]) puts[expirationDate] = []
        puts[expirationDate].push(optionData)
      } else {
        throw new Error(`Invalid option type:${type}`)
      }
    })

    const { e1, e2 } = findNearMonthExpirations(calls)

    logger.debug(`e1:${e1},e2:${e2}`)
    logger.debug(`exchangeRate:${exchangeRate}`)

    return {
      e1: moment(e1, 'DDMMYYYY'),
      e2: moment(e2, 'DDMMYYYY'),
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

function findNearMonthExpirations(calls: Record<string, Array<OptionData>>) {
  const e30 = moment().startOf('day').add(30, 'days')
  let e1 = moment()
  let e2: moment.Moment | undefined

  // Find last expiration before a full month && first expiration after a full month
  Object.keys(calls).forEach((expirationDate) => {
    const e = moment(expirationDate, DATE_FORMAT)
    if (e.isBefore(e30)) {
      if (e.isAfter(e1)) {
        e1 = e
      }
    } else if (e.isAfter(e30)) {
      if (!e2 || e.isBefore(e2)) {
        e2 = e
      }
    }
  })

  if (!e2) throw new Error('Could not find an expiration date after a full month')
  logger.debug(`e1:${toDate(e1)} e2:${toDate(<moment.Moment>e2)}`)
  return { e1: toDate(e1), e2: toDate(<moment.Moment>e2) }
}

function toDate(moment: moment.Moment) {
  return moment.format(DATE_FORMAT)
}

function convertToOptionData(option: DeribitOptionDataResponse) {
  const { instrument_name, mid_price, underlying_price } = option
  const [, expiration, strikePrice, type] = instrument_name.split('-')
  const optionData: OptionData = {
    strikePrice: new Big(strikePrice),
    midPrice: mid_price ? new Big(mid_price) : undefined,
    underlyingPrice: new Big(underlying_price),
    expiration: moment(expiration, 'DDMMMYY'),
    type,
  }

  return optionData
}
