/* eslint-disable max-nested-callbacks */
import { adapter } from '../../src'
import { expose } from '@chainlink/external-adapter-framework'
import request, { SuperTest, Test } from 'supertest'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { AddressInfo } from 'net'
import * as process from 'process'

let adapterServer: ServerInstance | undefined

describe('execute', () => {
  let req: SuperTest<Test>

  jest.setTimeout(10000)

  const successfulRequests = {
    crypto: {
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    },
    cryptoWithOverride: {
      data: {
        base: 'NONE',
        quote: 'USD',
        overrides: {
          cryptocompare: {
            NONE: 'ETH',
          },
        },
      },
    },
  }

  const errorRequests = {
    empty: {
      data: {},
    },
    cryptoWithBadSymbol: {
      data: {
        base: 'ZWXK',
        quote: 'USD',
      },
    },
    cryptoWithBadOverride: {
      data: {
        base: 'NONE',
        quote: 'USD',
        overrides: {
          genesis: {
            NONE: 'BAD',
          },
        },
      },
    },
  }

  const withCryptoWs = (payload: AdapterRequestBody) => ({
    ...payload,
    data: {
      ...payload.data,
      endpoint: 'crypto',
    },
  })

  beforeAll(async () => {
    try {
      adapterServer = await expose(adapter)
      req = request(`http://localhost:${(adapterServer?.server.address() as AddressInfo).port}`)
    } catch {
      throw new Error('Could not start server when running CryptoCompare e2e tests')
    }
    if (!adapterServer) {
      throw new Error('Could not start server when running CryptoCompare e2e tests')
    }

    // Send inital requests to warm the cache
    const pendingRequests: Test[] = []
    for (const reqData of Object.values(successfulRequests)) {
      pendingRequests.push(req.post('/').send(reqData))
    }
    for (const reqData of Object.values(successfulRequests)) {
      pendingRequests.push(req.post('/').send(withCryptoWs(reqData)))
    }
    for (const reqData of Object.values(errorRequests)) {
      pendingRequests.push(req.post('/').send(reqData))
    }
    for (const reqData of Object.values(errorRequests)) {
      pendingRequests.push(req.post('/').send(withCryptoWs(reqData)))
    }
    // Wait for all the pending requests to be complete
    Promise.all(pendingRequests)
    // Sleep while the cache is filled
    await sleep(5000)
  })

  afterAll((done) => {
    if (adapterServer) {
      adapterServer.close(done())
    }
  })

  describe('crypto', () => {
    it('should return error message for empty data', async () => {
      const response = await req
        .post('/')
        .send(errorRequests.empty)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(400)
      expect(typeof response.body.result === 'string')
    })

    it('should return success', async () => {
      const response = await req
        .post('/')
        .send(successfulRequests.crypto)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(200)
      expect(response.body.result).toBeGreaterThan(0)
    })

    it('should return 400 message for bad symbol', async () => {
      const response = await req
        .post('/')
        .send(errorRequests.cryptoWithBadSymbol)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(400)
      expect(typeof response.body.result === 'string')
    })

    it('should return success with override', async () => {
      const response = await req
        .post('/')
        .send(successfulRequests.cryptoWithOverride)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(200)
      expect(response.body.result).toBeGreaterThan(0)
    })
    it('should return 400 for bad override', async () => {
      const response = await req
        .post('/')
        .send(errorRequests.cryptoWithBadOverride)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(400)
      expect(typeof response.body.result === 'string')
    })
  })

  describe('crypto websocket', () => {
    beforeAll(() => {
      process.env['WS_ENABLED'] = 'true'
    })
    it('should return error message for empty data', async () => {
      const response = await req
        .post('/')
        .send(withCryptoWs(errorRequests.empty))
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(400)
      expect(typeof response.body.result === 'string')
    })

    it('should return success', async () => {
      const response = await req
        .post('/')
        .send(withCryptoWs(successfulRequests.crypto))
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(200)
      expect(response.body.result).toBeGreaterThan(0)
    })

    it('should return 400 message for bad symbol', async () => {
      const response = await req
        .post('/')
        .send(withCryptoWs(errorRequests.cryptoWithBadSymbol))
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(400)
      expect(typeof response.body.result === 'string')
    })

    it('should return success with override', async () => {
      const response = await req
        .post('/')
        .send(withCryptoWs(successfulRequests.cryptoWithOverride))
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(200)
      expect(response.body.result).toBeGreaterThan(0)
    })
    it('should return 400 for bad override', async () => {
      const response = await req
        .post('/')
        .send(withCryptoWs(errorRequests.cryptoWithBadOverride))
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(400)
      expect(typeof response.body.result === 'string')
    })
  })
})
