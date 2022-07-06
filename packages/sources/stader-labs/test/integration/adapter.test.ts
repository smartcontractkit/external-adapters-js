import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockMaticXSuccess, mockSFTMXSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || 'https://test-rpc-polygon-url/',
    FANTOM_RPC_URL: process.env.FANTOM_RPC_URL || 'https://test-rpc-fantom-url/',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('MaticX endpoint', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {},
    }

    it('should return success', async () => {
      mockMaticXSuccess()

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

  describe('sFTMx endpoint', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'sftmx',
      },
    }

    it('should return success', async () => {
      mockSFTMXSuccess()

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
