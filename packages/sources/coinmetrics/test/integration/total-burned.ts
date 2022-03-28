import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { SuiteContext } from './adapter.test'
import {
  mockCoinmetricsResponseError1,
  mockCoinmetricsResponseSuccessMalformed1,
  mockCoinmetricsResponseSuccessMalformed2,
  mockCoinmetricsResponseSuccess1,
  mockCoinmetricsResponseSuccess2,
} from './fixtures'

export function totalBurnedTests(context: SuiteContext): void {
  const id = '1'

  describe('error calls', () => {
    describe('when unsuccessfully requesting coinmetrics API', () => {
      it('should throw an exception', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'total-burned',
            asset: 'eth',
            startTime: '2021-08-05',
            endTime: '2021-08-05',
          },
        }
        mockCoinmetricsResponseError1()

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

    describe('when successfully requesting coinmetrics API', () => {
      it('should throw an exception if the response data format is malformed', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'total-burned',
            asset: 'eth',
            startTime: '2021-08-05',
            endTime: '2021-08-05',
          },
        }
        mockCoinmetricsResponseSuccessMalformed1()

        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        assertError({ expected: 500, actual: response.statusCode }, response.body, id)
      })

      it('should throw an exception if any asset metrics is malformed', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'total-burned',
            asset: 'eth',
            startTime: '2021-08-05',
            endTime: '2021-08-05',
          },
        }
        mockCoinmetricsResponseSuccessMalformed2()

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
    describe('when successfully requesting coinmetrics API without pagination', () => {
      it('should return greater than "0"', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'total-burned',
            asset: 'eth',
            startTime: '2021-09-20',
            endTime: '2021-09-25',
          },
        }
        mockCoinmetricsResponseSuccess1()

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

    describe('when successfully requesting coinmetrics API with pagination', () => {
      it('should return greater than "0"', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'total-burned',
            pageSize: 2,
            asset: 'eth',
            startTime: '2021-08-05',
            endTime: '2021-08-07',
          },
        }
        mockCoinmetricsResponseSuccess2()

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
