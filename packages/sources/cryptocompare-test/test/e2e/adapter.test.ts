/* eslint-disable max-nested-callbacks */
import { adapter } from '../../src'
import { expose } from '@chainlink/external-adapter-framework'
import request, { SuperTest, Test } from 'supertest'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { sleep } from '@chainlink/external-adapter-framework/util'

let adapterServer: ServerInstance | undefined

describe('execute', () => {
  const id = '1'
  let req: SuperTest<Test>

  jest.setTimeout(10000)

  const successfulRequests = {
    crypto: {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    },
    cryptoWithOverride: {
      id,
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
      id,
      data: {},
    },
    cryptoWithBadSymbol: {
      id,
      data: {
        base: 'ZWXK',
        quote: 'USD',
      },
    },
    cryptoWithBadOverride: {
      id,
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

  beforeAll(async () => {
    try {
      adapterServer = await expose(adapter)
      req = request('localhost:8080')
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
    for (const reqData of Object.values(errorRequests)) {
      pendingRequests.push(req.post('/').send(reqData))
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

  describe('crypto websocket', () => {
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

    it('should return 504 message for bad symbol', async () => {
      const response = await req
        .post('/')
        .send(errorRequests.cryptoWithBadSymbol)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(504)
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
    it('should return 504 for bad override', async () => {
      const response = await req
        .post('/')
        .send(errorRequests.cryptoWithBadOverride)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(504)
      expect(typeof response.body.result === 'string')
    })
  })
})
