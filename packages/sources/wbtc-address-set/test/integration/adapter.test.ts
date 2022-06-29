import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockAddressesResponseSuccess, mockMembersResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    MEMBERS_ENDPOINT: process.env.MEMBERS_ENDPOINT || 'http://localhost:8081',
    ADDRESSES_ENDPOINT: process.env.ADDRESSES_ENDPOINT || 'http://localhost:8082',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('members api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'members',
      },
    }

    it('should return success', async () => {
      mockMembersResponseSuccess()

      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('addresses api', () => {
    const data: AdapterRequest = {
      id,
      data: {},
    }

    it('should return success', async () => {
      mockAddressesResponseSuccess()

      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
