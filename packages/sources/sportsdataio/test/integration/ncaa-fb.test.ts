import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  const sport = 'NCAA-FB'

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { sport, endpoint: 'schedule', season: '2021REG' } },
      },
      {
        name: 'schedule',
        testData: { id: jobID, data: { sport, endpoint: 'schedule', season: '2021REG' } },
      },
      {
        name: 'scores',
        testData: { id: jobID, data: { sport, endpoint: 'scores', season: '2021REG' } },
      }
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        console.log(data)
        expect(data.result.length).toBeGreaterThan(0)
        expect(data.data.result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown season',
        testData: { id: jobID, data: { sport, endpoint: 'schedule', season: 'not_real' } },
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
