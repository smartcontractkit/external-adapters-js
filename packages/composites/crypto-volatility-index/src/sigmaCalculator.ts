import { Logger } from '@chainlink/ea-bootstrap'
import { Decimal } from 'decimal.js'
import moment from 'moment'
import { CurrencyDerivativesData, OptionData } from './derivativesDataProvider'

export type SigmaData = {
  e1: moment.Moment
  e2: moment.Moment
  sigma1: Decimal
  sigma2: Decimal
  now: moment.Moment
}

export class SigmaCalculator {
  weightedSigma(sigmaData: SigmaData): Decimal {
    const { e1, e2, sigma1, sigma2, now } = sigmaData
    const secondsInDay = 60 * 60 * 24
    const tm = new Decimal(secondsInDay * 30)
    const t1 = new Decimal(e1.diff(now, 'days') * secondsInDay)
    const t2 = new Decimal(e2.diff(now, 'days') * secondsInDay)

    const weighted = (t1.times(t2.minus(tm)).times(sigma1).minus((t2.times((t1.minus(tm)).times(sigma2)))))
      .div((t2.minus(t1)))
      .div(tm) // prettier-ignore

    return weighted
  }

  oneSigma(
    expiration: moment.Moment,
    exchangeRate: Decimal,
    calls: Array<OptionData>,
    puts: Array<OptionData>,
    now: moment.Moment,
  ): Decimal {
    const T = expiration.diff(now.startOf('day'), 'days') / 365.0 //TODO: Change to seconds
    const r = new Decimal(0)
    let S = new Decimal(0)
    let dK = new Decimal(0)
    let F = new Decimal(0)
    let K0c = new Decimal(0)
    calls.forEach((call: OptionData, idx: number) => {
      const { strikePrice, midPrice, underlyingPrice } = call
      if (strikePrice.gt(underlyingPrice)) {
        if (!midPrice) return
        F = underlyingPrice
        if (idx === 0) {
          dK = calls[idx + 1].strikePrice.minus(strikePrice)
        } else if (idx === calls.length - 1) {
          dK = strikePrice.minus(calls[idx - 1].strikePrice)
        } else {
          // eslint-disable-next-line prettier/prettier
          dK = calls[idx + 1].strikePrice.minus(calls[idx - 1].strikePrice).div(2)
        }

        S = S.plus(dK.times(midPrice).times(exchangeRate).div(strikePrice.pow(2)))
      } else {
        K0c = strikePrice
      }
    })

    let K0p = new Decimal(0)
    puts.forEach((put: OptionData, idx: number) => {
      const { strikePrice, midPrice, underlyingPrice } = put
      if (strikePrice.lt(underlyingPrice)) {
        if (!midPrice) return
        F = underlyingPrice
        if (idx === 0) {
          dK = strikePrice.minus(puts[idx + 1].strikePrice)
        } else if (idx === puts.length - 1) {
          dK = puts[idx - 1].strikePrice.minus(strikePrice)
        } else {
          // eslint-disable-next-line prettier/prettier
          dK = puts[idx - 1].strikePrice.minus(puts[idx + 1].strikePrice).div(2)
        }

        S = S.plus(dK.times(midPrice).times(exchangeRate).div(strikePrice.pow(2)))
      } else {
        K0p = strikePrice
      }
    })

    const K0 = (K0c.plus(K0p)).div(2) // prettier-ignore
    const sigma = (new Decimal(2)
      .times(new Decimal(Math.exp(Number(r.mul(T).toFixed()))))
      .times(S)
      .minus((F.div(K0).minus(1)).pow(2)).div(T)) // prettier-ignore

    Logger.debug(`Sigma:${sigma.toString()}`)
    return sigma
  }

  sortByStrikePrice(currencyDerivativesData: CurrencyDerivativesData): void {
    const { callsE1, putsE1, callsE2, putsE2 } = currencyDerivativesData
    _sortByStrikePrice(callsE1)
    _sortByStrikePrice(callsE2)
    _sortByStrikePrice(putsE1, true)
    _sortByStrikePrice(putsE2, true)
  }
}

const _sortByStrikePrice = (optionData: Array<OptionData>, isReversed = false) => {
  const sortFunc = isReversed
    ? (option1: OptionData, option2: OptionData) =>
        Number(option2.strikePrice.minus(option1.strikePrice))
    : (option1: OptionData, option2: OptionData) =>
        Number(option1.strikePrice.minus(option2.strikePrice))

  optionData.sort(sortFunc)
}
