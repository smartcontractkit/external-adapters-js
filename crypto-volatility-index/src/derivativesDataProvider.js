const { AdapterError, Requester, logger } = require('@chainlink/external-adapter')
const axios = require('axios')
const moment = require('moment')

const EXCHANGE_URL = `https://www.deribit.com/api/v2/public`
const currencyEndpoint = `${EXCHANGE_URL}/get_index`
const bookDataEndpoint = `${EXCHANGE_URL}/get_book_summary_by_currency`

const DATE_FORMAT = 'DDMMYYYY'

const getDerivativesData = async (cryptoCurrencies) => {
  const currencyValues = await Promise.all(
    cryptoCurrencies.map(async (currency) => {
      return await getCurrencyData(currency)
    }),
  )

  logger.debug('currencyValues:', currencyValues)

  const optionsData = await Promise.all(
    cryptoCurrencies.map(async (currency, index) => {
      return await getOptionsData(currency, currencyValues[index])
    }),
  )
  // Return derivatives data mapped by currency
  return optionsData.reduce((obj, data, idx) => {
    obj[cryptoCurrencies[idx]] = data
    return obj
  }, {})
}

const getCurrencyData = async (currency) => {
  const config = {
    url: currencyEndpoint,
    params: { currency },
  }

  const response = await Requester.request(config)
  const path = ['result', currency]
  return Requester.validateResultNumber(response.data, path)
}

const getOptionsData = async (currency, exchangeRate) => {
  const config = {
    url: bookDataEndpoint,
    params: { currency, kind: 'option' },
  }

  try {
    const response = await axios(config)
    const result = response.data.result
    const calls = {}
    const puts = {}
    result.forEach((option) => {
      const { instrument_name, mid_price, underlying_price } = option
      const [optionCurrency, expiration, strikePrice, type] = instrument_name.split('-')
      if (!optionCurrency === currency) throw new Error(`Invalid option currency:${optionCurrency}`)
      const optionData = { strikePrice, midPrice: mid_price, underlyingPrice: underlying_price }
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
    throw new AdapterError(error)
  }
}

function findNearMonthExpirations(calls) {
  const e30 = moment().startOf('day').add(30, 'days')
  let e1 = moment()
  let e2

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

  logger.debug(`e1:${toDate(e1)} e2:${toDate(e2)}`)
  return { e1: toDate(e1), e2: toDate(e2) }
}

function toDate(moment) {
  return moment.format(DATE_FORMAT)
}
module.exports = {
  getDerivativesData,
}
