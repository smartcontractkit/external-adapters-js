const { logger } = require('@chainlink/external-adapter')
const Big = require('big.js')
const dataProvider = require('./derivativesDataProvider.js')
const marketCapProvider = require('./marketCapProvider.js')
const sigmaCalculator = require('./sigmaCalculator.js')
const cron = require('node-cron')
const moment = require('moment')
const { POINTS_TO_AVG, FREQ_MINUTES } = require('./config')
const cryptoCurrencies = ['BTC', 'ETH']
const cvxValues = {}

const calculate = async () => {
  // Get all of the required derivatives data for the calculations, for all the relevant currencies
  const derivativesData = await dataProvider.getDerivativesData(cryptoCurrencies)
  // Calculate vix values for all currencies
  const volatilityIndexData = await calculateVixValues(derivativesData)
  // Apply averaging based on previous iterations
  const smoothedData = await applyAveraging(volatilityIndexData)
  // Apply weights to calculate the Crypto Vix
  const cvx = await calculateWeighted(smoothedData)
  logger.info(`CVX: ${cvx}`)
  return cvx
}

let _isScheduled = false
const scheduleCron = async () => {
  if (_isScheduled) return

  cron.schedule(`0 */${FREQ_MINUTES} * * * *`, async () => {
    await calculate()
  })
}

const calculateVixValues = async (derivativesData) => {
  const now = moment()
  const vixValues = cryptoCurrencies.map((currency) => {
    sigmaCalculator.sortByStrikePrice(derivativesData[currency])
    const { e1, e2, exchangeRate, callsE1, putsE1, callsE2, putsE2 } = derivativesData[currency]
    const weightedSigma = sigmaCalculator.weightedSigma({
      e1,
      e2,
      sigma1: sigmaCalculator.oneSigma(e1, exchangeRate, callsE1, putsE1, now),
      sigma2: sigmaCalculator.oneSigma(e2, exchangeRate, callsE2, putsE2, now),
      now,
    })

    return weightedSigma.sqrt().times(100)
  })

  return vixValues
}

const applyAveraging = async (vixData) => {
  const averagedData = []
  cryptoCurrencies.forEach((currency, idx) => {
    if (!cvxValues[currency]) {
      cvxValues[currency] = []
    }
    cvxValues[currency].push(vixData[idx])
    const numExpiredValues = cvxValues[currency].length - POINTS_TO_AVG
    cvxValues[currency].splice(0, numExpiredValues)
    const total = cvxValues[currency].reduce((total, value) => {
      total = total.plus(value)
      return total
    }, new Big(0))
    const averagedValue = total.div(new Big(cvxValues[currency].length))
    averagedData.push(averagedValue)

    logger.debug(
      `Average value for ${currency}:${averagedValue.toString()}, accumulated values:${
        cvxValues[currency].length
      }`,
    )
    cvxValues[currency].map((d) => d.toString()).forEach(logger.debug)
  })

  return averagedData
}

const calculateWeighted = async (vixData) => {
  const marketCaps = await marketCapProvider.getMarketCaps(cryptoCurrencies)
  const totalMarketCap = marketCaps.reduce((total, mc) => {
    return total.plus(new Big(mc))
  }, new Big(0))

  const weightedVix = cryptoCurrencies.reduce((vix, currency, idx) => {
    const marketCap = new Big(marketCaps[idx])
    const currencyVix = new Big(vixData[idx])
    // Weight by market cap
    vix = vix.plus(currencyVix.times(marketCap).div(totalMarketCap))
    return vix
  }, new Big(0))

  return Number(weightedVix.toFixed())
}

module.exports = {
  calculate,
  scheduleCron,
}
