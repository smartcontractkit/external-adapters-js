import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import type { AdapterRequest } from '@chainlink/types'
import type { AddressInfo } from 'net'
import request from 'supertest'
import type { SuperTest, Test } from 'supertest'

import type { SuiteContext } from './adapter.test'
import {
  mockDnsProofResponseError,
  mockDnsProofResponseSuccessMalformed,
  mockDnsProofResponseSuccess,
} from './fixtures'

export function dnsProofTests(context: SuiteContext): void {
  let req: SuperTest<Test>
  const id = '1'

  beforeAll(() => {
    req = request(`localhost:${(context.server.address() as AddressInfo).port}`)
  })

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

        const response = await req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertError({ expected: 500, actual: response.body.providerStatusCode }, response.body, id)
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

        const response = await req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        assertError({ expected: 200, actual: response.statusCode }, response.body, id)
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

      const response = await req
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
