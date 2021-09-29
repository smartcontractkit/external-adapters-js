import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const year = d.getFullYear()
  let month = String(d.getMonth() + 1)
  let day = String(d.getDate())
  month = month.length == 1 ? month.padStart(2, '0') : month
  day = day.length == 1 ? day.padStart(2, '0') : day
  return `${year}-${month}-${day}`
}

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.API_KEY = process.env.API_KEY || 'hGeSkKBRGhDLIyskqnGE'

  describe('validation error', () => {
    const requests = [
      {
        name: 'invalid startDate format',
        testData: {
          id: jobID,
          data: {
            endpoint: 'burned',
            startDate: '20210805',
            endDate: '2021-09-05',
          },
        },
      },
      {
        name: 'startDate greater than today',
        testData: {
          id: jobID,
          data: {
            endpoint: 'burned',
            startDate: tomorrow(),
            endDate: '2021-09-05',
          },
        },
      },
      {
        name: 'invalid endDate format',
        testData: {
          id: jobID,
          data: {
            endpoint: 'burned',
            startDate: '2021-08-10',
            endDate: '20210805',
          },
        },
      },
      {
        name: 'endDate greater than today',
        testData: {
          id: jobID,
          data: {
            endpoint: 'burned',
            startDate: '2021-08-10',
            endDate: tomorrow(),
          },
        },
      },
      {
        name: 'startDate greater than endDate',
        testData: {
          id: jobID,
          data: {
            endpoint: 'burned',
            startDate: '2021-09-10',
            endDate: '2021-08-10',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
