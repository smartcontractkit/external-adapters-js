import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import { TInputParameters } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            from: 'ETH',
            to: 'USD',
            fromDate: '2021-11-01',
            toDate: '2021-11-08',
            source: 'coinmarketcap',
            interval: '1d',
          },
        },
      },
      {
        name: 'fromDate/toDate',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            fromDate: '2021-11-01',
            toDate: '2021-11-08',
            source: 'coinmarketcap',
            interval: '1d',
          },
        },
      },
      {
        name: 'fromDate + days',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            fromDate: '2021-11-01',
            days: 7,
            source: 'coinmarketcap',
            interval: '1d',
          },
        },
      },
      {
        name: 'toDate + days',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            toDate: '2021-11-08',
            days: 7,
            source: 'coinmarketcap',
            interval: '1d',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as unknown as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })
})
