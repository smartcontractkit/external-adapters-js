import { assertSuccess, serverErrors, validationErrors } from '@chainlink/ea-test-helpers'
import { AdapterData, AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [
      {
        name: 'from and to supplied',
        testData: {
          data: {
            endpoint: 'example',
            from: 'ETH',
            to: 'BTC',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result?.toString().length).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    validationErrors(
      [
        { name: 'empty body', testData: {} },
        {
          name: 'missing base',
          testData: {
            id: jobID,
            data: {
              endpoint: 'example',
            },
          },
        },
        {
          name: 'empty base',
          testData: {
            id: jobID,
            data: {
              endpoint: 'example',
              base: '',
            },
          },
        },
      ],
      execute as Execute<AdapterRequest<AdapterData>>,
    )

    serverErrors(
      [
        {
          name: 'invalid symbols',
          testData: {
            id: jobID,
            data: {
              endpoint: 'example',
              result: [
                {
                  from: '$999$',
                  to: '$999$',
                },
              ],
            },
          },
        },
      ],
      execute as Execute<AdapterRequest<AdapterData>>,
    )
  })
})
