import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { SuiteContext } from './adapter.test'
import {
  mockAWLocationResponseError,
  mockAWLocationResponseSuccessLocationNotFound,
  mockAWLocationResponseSuccessLocationFound,
  mockAWLocationResponseSuccessMalformed1,
  mockAWLocationResponseSuccessMalformed2,
} from './fixtures'

export function locationTests(context: SuiteContext): void {
  const id = '1'

  describe('error calls', () => {
    describe('when unsuccessfully requests accuweather API', () => {
      it('should throw an exception', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
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

    describe('when successfully requests accuweather API', () => {
      it('should throw an exception if the response data format is malformed', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
          },
        }
        mockAWLocationResponseSuccessMalformed1()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        assertError({ expected: 500, actual: response.statusCode }, response.body, id)
      })

      it('should throw an exception if the response is missing data', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
          },
        }
        mockAWLocationResponseSuccessMalformed2()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        assertError({ expected: 500, actual: response.statusCode }, response.body, id)
      })
    })
  })

  describe('success calls', () => {
    describe('when no location is found for the given coordinates', () => {
      it('returns the result encoded', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'location',
            lat: 0,
            lon: 0,
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
            endpoint: 'location',
            lat: 0,
            lon: 0,
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
            endpoint: 'location',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
          },
        }
        mockAWLocationResponseSuccessLocationFound()

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
            endpoint: 'location',
            lat: '40.78136100040876',
            lon: '-77.89687509335249',
            encodeResult: false,
          },
        }
        mockAWLocationResponseSuccessLocationFound()

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
