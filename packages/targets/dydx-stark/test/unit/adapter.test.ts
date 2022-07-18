import { Execute, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute() as Execute

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'asset not supplied',
        testData: { id: jobID, data: { asset: '' } },
      },
      {
        name: 'price not a supplied',
        testData: { id: jobID, data: { asset: 'BTCUSD' } },
      },
      {
        name: 'price not a number',
        testData: { id: jobID, data: { asset: 'BTCUSD', dataPath: 'price', price: 'aaa' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          // @ts-expect-error  need to pass wrong typed data to make sure test is failing
          await execute(req.testData, {})
        } catch (error: any) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
