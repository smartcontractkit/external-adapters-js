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
        name: 'id not supplied',
        testData: {
          data: { addresses: [{ address: '0xfF1BE3171A16FE431E31d874E4De14814362E588' }] },
        },
      },
      {
        name: 'single address supplied',
        testData: {
          id: jobID,
          data: { addresses: [{ address: '0xfF1BE3171A16FE431E31d874E4De14814362E588' }] },
        },
      },
      {
        name: 'multiple addresses supplied',
        testData: {
          id: jobID,
          data: {
            result: [
              { address: '0xfF1BE3171A16FE431E31d874E4De14814362E588' },
              { address: '0xbef7bcbDFbE321e1f407282a9caFcA41A4984a4d' },
            ],
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result?.toString().length).toBeGreaterThan(0)
        expect(data.result?.toString().length).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    validationErrors(
      [
        { name: 'empty body', testData: {} },
        {
          name: 'empty addresses',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              result: [],
            },
          },
        },
      ],
      execute as Execute<AdapterRequest<AdapterData>>,
    )

    serverErrors(
      [
        {
          name: 'invalid address',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              result: [
                {
                  address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
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
