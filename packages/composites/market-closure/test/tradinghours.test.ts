import { assert } from 'chai'
import { isMarketClosed } from '../src/checks/tradinghours'
import { doesNotReject } from 'assert'
import { AdapterRequest } from '@chainlink/types'

describe('isMarketClosed TradingHours', () => {
  context('successful calls @integration', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'FTSE',
        input: { id: jobID, data: { symbol: 'FTSE' } },
      },
      {
        name: 'Nikkei',
        input: { id: jobID, data: { symbol: 'N225' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const res = await isMarketClosed(req.input as AdapterRequest)
        assert.isBoolean(res)
        await doesNotReject(isMarketClosed(req.input as AdapterRequest))
      })
    })
  })
})
