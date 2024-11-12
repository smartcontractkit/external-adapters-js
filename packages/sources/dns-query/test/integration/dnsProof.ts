import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import type { AdapterRequest } from '@chainlink/ea-bootstrap'
import type { SuiteContext } from './adapter.test'
import {
  mockDnsProofResponseError,
  mockDnsProofResponseSuccessMalformed,
  mockDnsProofResponseSuccess,
} from './fixtures'
import { SuperTest, Test } from 'supertest'

export function dnsProofTests(context: SuiteContext): void {
  const id = '1'

  describe('error calls', () => {
    describe('when unsuccessfully requests the API', () => {
      it('should throw and exception', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'dnsProof',
            name: 'www5.infernos.io',
            record: '0xf75519f611776c22275474151a04183665b7feDe',
          },
        }
        mockDnsProofResponseError()

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertError({ expected: 500, actual: response.body.providerStatusCode }, response.body, id)
        expect(response.body).toMatchSnapshot()
      })
    })

    describe('when successfully requests the API', () => {
      it('should throw and exception if the response is malformed', async () => {
        const data: AdapterRequest = {
          id,
          data: {
            endpoint: 'dnsProof',
            name: 'www5.infernos.io',
            record: '0xf75519f611776c22275474151a04183665b7feDe',
          },
        }

        mockDnsProofResponseSuccessMalformed()

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertError({ expected: 200, actual: response.statusCode }, response.body, id)
        expect(response.body).toMatchSnapshot()
      })
    })
  })

  describe('success calls', () => {
    it('returns the result', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'dnsProof',
          name: 'www5.infernos.io',
          record: '0xf75519f611776c22275474151a04183665b7feDe',
        },
      }
      mockDnsProofResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
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
