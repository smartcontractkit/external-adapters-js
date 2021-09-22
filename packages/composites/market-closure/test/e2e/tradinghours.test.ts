import { AdapterRequest } from '@chainlink/types'
import { doesNotReject } from 'assert'
import { isMarketClosed } from '../../src/checks/tradinghours'

describe('isMarketClosed TradingHours', () => {
  describe('successful calls @integration', () => {
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
        expect(typeof res).toBe('boolean')
        await doesNotReject(isMarketClosed(req.input as AdapterRequest))
      })
    })
  })
})
