import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import {
  mockAWCurrentConditionsResponseError,
  mockAWCurrentConditionsResponseSuccess,
  mockAWLocationResponseError,
  mockAWLocationResponseSuccessLocationFound,
  mockAWLocationResponseSuccessLocationNotFound,
} from './fixtures'
import { Unit } from '../../src/endpoint/current-conditions'
import { SuiteContext } from './adapter.test'

export function locationCurrentConditionsTests(context: SuiteContext): void {
  const id = '1'

  describe('error calls', () => {
    describe('when the location endpoint fails', () => {
      it('should throw an exception', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location-current-conditions',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
            units: Unit.METRIC,
          },
        }
        mockAWLocationResponseError()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertError({ expected: 500, actual: response.body.providerStatusCode }, response.body, id)
      })
    })

    describe('when the current-conditions endpoint fails', () => {
      it('should throw an exception', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location-current-conditions',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
            units: Unit.METRIC,
          },
        }
        mockAWLocationResponseSuccessLocationFound()
        mockAWCurrentConditionsResponseError(2097720)

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertError({ expected: 500, actual: response.body.providerStatusCode }, response.body, id)
      })
    })
  })

  describe('success calls', () => {
    describe('when no location is found for the given coordinates', () => {
      it('returns the result encoded', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location-current-conditions',
            lat: 0,
            lon: 0,
            units: Unit.METRIC,
          },
        }
        mockAWLocationResponseSuccessLocationNotFound()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertSuccess({ expected: 200, actual: response.statusCode }, response.body, id)
        expect(response.body).toMatchSnapshot()
      })

      it('returns the result as JSON', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location-current-conditions',
            lat: 0,
            lon: 0,
            units: Unit.METRIC,
            encodeResult: false,
          },
        }
        mockAWLocationResponseSuccessLocationNotFound()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertSuccess({ expected: 200, actual: response.statusCode }, response.body, id)
        expect(response.body).toMatchSnapshot()
      })
    })

    describe('when a location is found for the given coordinates', () => {
      it('returns the result encoded', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location-current-conditions',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
            units: Unit.METRIC,
          },
        }
        mockAWLocationResponseSuccessLocationFound()
        mockAWCurrentConditionsResponseSuccess()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertSuccess({ expected: 200, actual: response.statusCode }, response.body, id)
        expect(response.body).toMatchSnapshot()
      })

      it('returns the result as JSON', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location-current-conditions',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
            units: Unit.METRIC,
            encodeResult: false,
          },
        }
        mockAWLocationResponseSuccessLocationFound()
        mockAWCurrentConditionsResponseSuccess()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertSuccess({ expected: 200, actual: response.statusCode }, response.body, id)
        expect(response.body).toMatchSnapshot()
      })
    })
  })
}
