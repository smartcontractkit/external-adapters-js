import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import {
  mockAWCurrentConditionsResponseError,
  mockAWCurrentConditionsResponseSuccess,
  mockAWCurrentConditionsResponseSuccessMalformed1,
  mockAWCurrentConditionsResponseSuccessMalformed2,
  mockAWCurrentConditionsResponseSuccessMalformed3,
} from './fixtures'
import { Unit } from '../../src/endpoint/current-conditions'
import { SuiteContext } from './adapter.test'

export function currentConditionsTests(context: SuiteContext): void {
  const id = '1'

  describe('error calls', () => {
    const locationKey = 123456

    describe('when unsuccessfully requests accuweather API', () => {
      it('should throw an exception', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'current-conditions',
            locationKey,
            units: Unit.METRIC,
          },
        }
        mockAWCurrentConditionsResponseError(locationKey)

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

    describe('when successfully requests accuweather API', () => {
      it('should throw an exception if the response data format is malformed', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'current-conditions',
            locationKey,
            units: Unit.METRIC,
          },
        }
        mockAWCurrentConditionsResponseSuccessMalformed1(locationKey)

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        assertError({ expected: 500, actual: response.status }, response.body, id)
      })

      it('should throw an exception if the response is missing data', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'current-conditions',
            locationKey,
            units: Unit.METRIC,
          },
        }
        mockAWCurrentConditionsResponseSuccessMalformed2(locationKey)

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        assertError({ expected: 500, actual: response.status }, response.body, id)
      })

      it('should throw an exception if there is a NaN condition', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'current-conditions',
            locationKey,
            units: Unit.METRIC,
          },
        }
        mockAWCurrentConditionsResponseSuccessMalformed3(locationKey)

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        assertError({ expected: 500, actual: response.status }, response.body, id)
      })
    })
  })

  describe('success calls', () => {
    it('returns the result encoded', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'current-conditions',
          locationKey: 2097720,
          units: Unit.METRIC,
        },
      }
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
          endpoint: 'current-conditions',
          locationKey: 2097720,
          units: Unit.METRIC,
          encodeResult: false,
        },
      }
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
}
