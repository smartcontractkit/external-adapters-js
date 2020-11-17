import { assert } from 'chai'
import { isMarketClosed } from '../src/checks/tradinghours'

describe('isMarketClosed', () => {
  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'FTSE',
        symbol: 'FTSE',
      },
      {
        name: 'Nikkei',
        symbol: 'N225',
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const res = await isMarketClosed(req.symbol)
        assert.isBoolean(res)
        assert.doesNotThrow(async () => await isMarketClosed(req.symbol))
      })
    })
  })
})
