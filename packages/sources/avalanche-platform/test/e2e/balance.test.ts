import { assertSuccess, validationErrors } from '@chainlink/ea-test-helpers'
import { AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import { TInputParameters } from '../../src/endpoint'

jest.setTimeout(30000)

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            addresses: [
              {
                address: 'NodeID-4gPY8c21HFsLjRm3nCUS3KA8WZsEsqEKC',
              },
            ],
            field: 'stakeAmount',
          },
        },
      },
      {
        name: 'single address supplied',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                address: 'NodeID-4gPY8c21HFsLjRm3nCUS3KA8WZsEsqEKC',
              },
            ],
            field: 'stakeAmount',
          },
        },
      },
      {
        name: 'multiple addresses supplied',
        testData: {
          id: jobID,
          data: {
            result: [
              {
                address: 'NodeID-4gPY8c21HFsLjRm3nCUS3KA8WZsEsqEKC',
              },
              {
                address: 'NodeID-F823qVX3w3sVb6EWKnTFvfhnmTCCX91gX',
              },
            ],
            field: 'stakeAmount',
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
      execute as Execute,
    )
  })
})
