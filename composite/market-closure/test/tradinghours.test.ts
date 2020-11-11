import { assert } from 'chai'
import { thExecute } from '../src/checks/tradinghours'

describe('thExecute', () => {
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
        const res = await thExecute(req.symbol)
        assert.isBoolean(res)
        assert.doesNotThrow(async () => await thExecute(req.symbol))
      })
    })
  })
})
