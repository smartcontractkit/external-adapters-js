import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'
import {
  encodeLocationResult,
  getLocationResult,
  Location,
  LocationResult,
  noLocationResult,
} from '../../src/endpoint/location'

describe('validation error', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.API_KEY = 'test_api_key'

  const requests = [
    {
      name: 'lat not supplied',
      id: '1',
      testData: {
        data: {
          endpoint: 'location',
          lon: -7.77,
          lat: '',
        },
      },
    },
    {
      name: 'lon not supplied',
      id: '1',
      testData: {
        data: {
          endpoint: 'location',
          lat: 42.42,
        },
      },
    },
  ]
  requests.forEach((req) => {
    it(`${req.name}`, async () => {
      try {
        await execute(req.testData as AdapterRequest<TInputParameters>, {})
      } catch (error) {
        const errorResp = Requester.errored(jobID, error as AdapterError)
        assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
      }
    })
  })
})

describe('getLocationResult()', () => {
  const testCasesError = [
    {
      name: 'locations has more than one item',
      testData: ['item1', 'item2'],
    },
    {
      name: 'location key is not a number',
      testData: [
        {
          Key: 'LINK',
          EnglishName: 'Chainlink',
          Country: {
            ID: 'CL',
          },
        },
      ],
    },
    {
      name: 'location is missing data',
      testData: [
        {
          Key: '777',
          EnglishName: 'Chainlink',
          Country: {},
        },
      ],
    },
  ]
  testCasesError.forEach((testCase) => {
    it(`throws an error when ${testCase.name}`, async () => {
      expect(() => getLocationResult(testCase.testData as Location[])).toThrow()
    })
  })

  it('returns the noLocationResult object', () => {
    const locationResult = getLocationResult([])

    expect(locationResult).toEqual(noLocationResult)
  })

  it('parses the API response data', () => {
    const locations: Location[] = [
      {
        Key: '777',
        EnglishName: 'Chainlink',
        Country: { ID: 'CL' },
      },
    ]

    const locationResult = getLocationResult(locations)

    const expectedLocationResult: LocationResult = {
      locationFound: true,
      locationKey: 777,
      name: 'Chainlink',
      countryCode: '0x434c',
    }
    expect(locationResult).toEqual(expectedLocationResult)
  })
})

describe('encodeLocationResult()', () => {
  it('encodes the endpoint result', () => {
    const locationResult: LocationResult = {
      locationFound: true,
      locationKey: 777,
      name: 'Chainlink',
      countryCode: '0x434c',
    }

    const encodedResult = encodeLocationResult(locationResult)

    const expectedEncodedResult =
      '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003090000000000000000000000000000000000000000000000000000000000000060434c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009436861696e6c696e6b0000000000000000000000000000000000000000000000'
    expect(encodedResult).toBe(expectedEncodedResult)
  })
})
