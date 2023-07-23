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
                address: 'P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt',
                network: 'avalanche-fuji',
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
                address: 'P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt',
                network: 'avalanche-fuji',
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
                address: 'P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt',
                network: 'avalanche-fuji',
              },
              {
                address: 'P-fuji1wycv8n7d2fg9aq6unp23pnj4q0arv03ysya8jw',
                network: 'avalanche-fuji',
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
