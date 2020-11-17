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
        const input = { id: '1', data: { symbol: req.symbol } }
        const res = await isMarketClosed(input)
        assert.isBoolean(res)
        assert.doesNotThrow(async () => await isMarketClosed(input))
      })
    })
  })
})
