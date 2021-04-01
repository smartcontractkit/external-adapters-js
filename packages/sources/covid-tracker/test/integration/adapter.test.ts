import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'no params supplied',
        testData: { id: jobID, data: {} },
      },
      {
        name: 'id not supplied',
        testData: { data: { field: 'totalTestResults' } },
      },
      {
        name: 'without date',
        testData: { id: jobID, data: { field: 'totalTestResultsIncrease' } },
      },
      {
        name: 'with date',
        testData: { id: jobID, data: { field: 'death', date: '20201010' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'unknown date format',
        testData: { id: jobID, data: { field: 'deaths', date: 'not_real' } },
      },
      {
        name: 'unknown date format 2',
        testData: { id: jobID, data: { field: 'deaths', date: '2020111' } },
      },
      {
        name: 'date not found',
        testData: { id: jobID, data: { field: 'deaths', date: '17601010' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown field',
        testData: { id: jobID, data: { field: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
