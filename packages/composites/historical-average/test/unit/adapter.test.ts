import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import { makeConfig } from '../../src'
import { TInputParameters, getFromToDates } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute(makeConfig())

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'from not supplied',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            fromDate: '2021-11-01',
            days: 7,
            source: 'coinmarketcap',
          },
        },
      },
      {
        name: 'to not supplied',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            fromDate: '2021-11-01',
            days: 7,
            source: 'coinmarketcap',
          },
        },
      },
      {
        name: 'both fromDate & toDate not supplied',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            days: 7,
            source: 'coinmarketcap',
          },
        },
      },
      {
        name: 'fromDate supplied but days not supplied',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            fromDate: '2021-11-01',
            source: 'coinmarketcap',
          },
        },
      },
      {
        name: 'toDate supplied but days not supplied',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            toDate: '2021-11-01',
            source: 'coinmarketcap',
          },
        },
      },
      {
        name: 'source not supplied',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            fromDate: '2021-11-01',
            toDate: '2021-11-08',
          },
        },
      },
      {
        name: 'fromDate is after toDate',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            fromDate: '2021-11-08',
            toDate: '2021-11-01',
            source: 'coinmarketcap',
          },
        },
      },
      {
        name: 'the days param is <= 0',
        testData: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
            fromDate: '2021-11-01',
            days: 0,
            source: 'coinmarketcap',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})

describe('getFromToDates', () => {
  it('should ignore days when both to- and from-dates are provided', () => {
    const { fromDate, toDate } = getFromToDates('2021-11-01', '2021-11-02', 100)
    expect(fromDate.toDateString()).toBe(new Date('2021-11-01').toDateString())
    expect(toDate.toDateString()).toBe(new Date('2021-11-02').toDateString())
  })

  it('should add days to fromDate when toDate is omitted', () => {
    const { fromDate, toDate } = getFromToDates('2021-11-01', undefined, 7)
    expect(fromDate.toDateString()).toBe(new Date('2021-11-01').toDateString())
    expect(toDate.toDateString()).toBe(new Date('2021-11-08').toDateString())
  })

  it('should subtract days from toDate when fromDate is omitted', () => {
    const { fromDate, toDate } = getFromToDates(undefined, '2021-11-08', 7)
    expect(fromDate.toDateString()).toBe(new Date('2021-11-01').toDateString())
    expect(toDate.toDateString()).toBe(new Date('2021-11-08').toDateString())
  })
})
