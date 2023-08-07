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
                address:
                  '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
              },
            ],
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
                address:
                  '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
              },
            ],
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
                address:
                  '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
              },
              {
                address:
                  '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
              },
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
      execute as Execute,
    )
  })
})
