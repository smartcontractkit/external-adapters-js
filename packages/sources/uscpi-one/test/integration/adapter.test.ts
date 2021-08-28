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
        name: 'id not supplied',
        testData: { data: { serie: 'EIUIR', month: 'july', year: '2021' } },
      },
      {
        name: 'unknown serie',
        testData: { id: jobID, data: { month: 'july', year: '2021' } },
      },
      {
        name: 'unknown data',
        testData: { id: jobID, data: {} },
      },
      {
        name: 'unknown month and year',
        testData: { id: jobID, data: { serie: 'EIUIR' } },
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

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown month',
        testData: { id: jobID, data: { month: 'not_real', year: '2021' } },
      },
      {
        name: 'unknown year',
        testData: { id: jobID, data: { month: 'july', year: 'not_real' } },
      },
      {
        name: 'unknown serie',
        testData: { id: jobID, data: { serie: 'not_real' } },
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
