const { logger } = require('@chainlink/external-adapter')
const Big = require('big.js')

const weightedSigma = (derivativesData) => {
  const { e1, e2, sigma1, sigma2, now } = derivativesData
  const secondsInDay = 60 * 60 * 24
  const tm = new Big(secondsInDay * 30)
  const t1 = new Big(e1.diff(now, 'days') * secondsInDay)
  const t2 = new Big(e2.diff(now, 'days') * secondsInDay)

  const weighted = (t1.times(t2.minus(tm)).times(sigma1).minus((t2.times((t1.minus(tm)).times(sigma2)))))
    .div((t2.minus(t1)))
    .div(tm) // prettier-ignore

  return weighted
}

const oneSigma = (expiration, exchangeRate, calls, puts, now) => {
  const T = expiration.diff(now.startOf('day'), 'days') / 365.0
  let r = new Big(0)
  let S = new Big(0)
  let dK = new Big(0)
  let F = new Big(0)
  let K0c = new Big(0)
  calls.forEach((call, idx) => {
    const { strikePrice, midPrice, underlyingPrice } = _getPrices(call)
    if (strikePrice.gt(underlyingPrice)) {
      if (!midPrice) return
      F = underlyingPrice
      if (idx === 0) {
        dK = new Big(calls[idx + 1].strikePrice).minus(strikePrice)
      } else if (idx === calls.length - 1) {
        dK = strikePrice.minus(new Big(calls[idx - 1].strikePrice))
      } else {
        dK = new Big(calls[idx + 1].strikePrice - calls[idx - 1].strikePrice).div(2)
      }

      S = S.plus(dK.times(midPrice).times(exchangeRate).div(strikePrice.pow(2)))
    } else {
      K0c = strikePrice
    }
  })

  let K0p = new Big(0)
  puts.forEach((put, idx) => {
    const { strikePrice, midPrice, underlyingPrice } = _getPrices(put)
    if (strikePrice.lt(underlyingPrice)) {
      if (!midPrice) return
      F = underlyingPrice
      if (idx === 0) {
        dK = new Big(strikePrice.minus(new Big(puts[idx + 1].strikePrice)))
      } else if (idx === puts.length - 1) {
        dK = new Big(puts[idx - 1].strikePrice).minus(strikePrice)
      } else {
        dK = new Big(puts[idx - 1].strikePrice - puts[idx + 1].strikePrice).div(2)
      }

      S = S.plus(dK.times(midPrice).times(exchangeRate).div(strikePrice.pow(2)))
    } else {
      K0p = strikePrice
    }
  })

  const K0 = (K0c.plus(K0p)).div(2) // prettier-ignore
  const sigma = (new Big(2)
    .times(new Big(Math.exp(r * T)))
    .times(S)
    .minus((F.div(K0).minus(1)).pow(2)).div(T)) // prettier-ignore

  logger.debug(`Sigma:${sigma.toString()}`)
  return sigma
}

function sortByStrikePrice(currencyDerivativesData) {
  const { callsE1, putsE1, callsE2, putsE2 } = currencyDerivativesData
  _sortByStrikePrice(callsE1)
  _sortByStrikePrice(callsE2)
  _sortByStrikePrice(putsE1, true)
  _sortByStrikePrice(putsE2, true)
}

const _sortByStrikePrice = (optionData, isReversed = false) => {
  const sortFunc = isReversed
    ? (option1, option2) => option2.strikePrice - option1.strikePrice
    : (option1, option2) => option1.strikePrice - option2.strikePrice

  optionData.sort(sortFunc)
}

const _getPrices = (option) => {
  return {
    strikePrice: new Big(option.strikePrice),
    midPrice: option.midPrice ? new Big(option.midPrice) : undefined,
    underlyingPrice: new Big(option.underlyingPrice),
  }
}

module.exports = {
  weightedSigma,
  oneSigma,
  sortByStrikePrice,
}
