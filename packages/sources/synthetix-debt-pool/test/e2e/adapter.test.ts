import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/utils'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'aggregate debt across all chains without defining chainSources',
        testData: { data: {} },
      },
      {
        name: 'aggregate debt across all chains',
        testData: {
          data: {
            chainSources: [],
          },
        },
      },
      {
        name: 'get debt from just a single chain',
        testData: {
          data: {
            chainSources: ['ethereum'],
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).not.toBeNull()
      })
    })
  })
})
