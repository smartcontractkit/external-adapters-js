import { logger } from '@chainlink/external-adapter'
import { getDerivativesData, CurrencyDerivativesData } from './derivativesDataProvider'
import { getMarketCaps } from './marketCapProvider'
import { SigmaCalculator } from './sigmaCalculator'
import { Big } from 'big.js'
import moment from 'moment'
const cryptoCurrencies = ['BTC', 'ETH']

export const calculate = async (): Promise<number> => {
  // Get all of the required derivatives data for the calculations, for all the relevant currencies
  const derivativesData = await getDerivativesData(cryptoCurrencies)
  // Calculate vix values for all currencies
  const volatilityIndexData = await calculateVixValues(derivativesData)
  // Apply weights to calculate the Crypto Vix
  const cvx = await calculateWeighted(volatilityIndexData)
  logger.info(`CVX: ${cvx}`)
  return cvx
}

const calculateVixValues = async (derivativesData: Record<string, CurrencyDerivativesData>) => {
  const now = moment()
  const sigmaCalculator = new SigmaCalculator()
  const vixValues = cryptoCurrencies.map((currency) => {
    sigmaCalculator.sortByStrikePrice(derivativesData[currency])
    const { e1, e2, exchangeRate, callsE1, putsE1, callsE2, putsE2 } = derivativesData[currency]
    const weightedSigma: Big = sigmaCalculator.weightedSigma({
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

const calculateWeighted = async (vixData: Array<Big>) => {
  const marketCaps = await getMarketCaps(cryptoCurrencies)
  const totalMarketCap = marketCaps.reduce((total: Big, mc: number) => {
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
