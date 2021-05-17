import { SigmaCalculator } from '../src/sigmaCalculator'
import { CurrencyDerivativesData, OptionData } from '../src/derivativesDataProvider'
import { Decimal } from 'decimal.js'
import moment from 'moment'

describe('sigma calculator', () => {
  describe('data handling', () => {
    it('sorts strikes prices correctly', () => {
      const fixture1: CurrencyDerivativesData = {
        e1: moment(),
        e2: moment(),
        callsE1: [_createOptionWithStrike(500, 'C'), _createOptionWithStrike(400, 'C')],
        callsE2: [_createOptionWithStrike(500, 'C'), _createOptionWithStrike(400, 'C')],
        putsE1: [_createOptionWithStrike(400, 'P'), _createOptionWithStrike(500, 'P')],
        putsE2: [_createOptionWithStrike(400, 'P'), _createOptionWithStrike(500, 'P')],
        exchangeRate: new Decimal(0),
      }

      const sigmaCalculator = new SigmaCalculator()
      sigmaCalculator.sortByStrikePrice(fixture1)
      const { callsE1, callsE2, putsE1, putsE2 } = fixture1
      expect(callsE1[0].strikePrice.lt(callsE1[1].strikePrice))
      expect(callsE2[0].strikePrice.lt(callsE1[1].strikePrice))
      expect(putsE1[0].strikePrice.gt(putsE1[1].strikePrice))
      expect(putsE1[0].strikePrice.gt(putsE2[1].strikePrice))
    })
  })
})

function _createOptionWithStrike(strikePrice: number, type: string): OptionData {
  return {
    strikePrice: new Decimal(strikePrice),
    midPrice: new Decimal(0),
    underlyingPrice: new Decimal(0),
    expiration: moment(),
    type,
  }
}
