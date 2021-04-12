import * as limits from '../../../src/lib/provider-limits'

const limitsJSONPath = '../../../src/lib/provider-limits/limits.json'

jest.mock('../../../src/lib/provider-limits/limits.json', () => ({
  amberdata: {
    http: {
      starter: {
        rateLimit1h: 10
      },
      premium: {
        rateLimit1h: 20
      },
      business: {
        rateLimit1h: 30
      },
    },
    ws: {
      starter: {
        connections: 10,
        subscriptions: 20
      }
    }
  }
}), { virtual: true })


describe('Provider Limits', () => {
  describe('Limits API', () => {
    it('gets the correct rate limits', () => {
      const limit = limits.getRateLimit('amberdata', 'starter')
      expect(limit.minute).toBe(10/60)
      expect(limit.second).toBe(10/60/60 * 2)
    })

    it('default rate limit if no tier match', () => {
      const limit = limits.getRateLimit('amberdata', 'non-existent')
      expect(limit.minute).toBe(limits.DEFAULT_MINUTE_RATE_LIMIT)
    })

    it('default rate limit if no provider match', () => {
      const limit = limits.getRateLimit('non-existent', 'non-existent')
      expect(limit.minute).toBe(limits.DEFAULT_MINUTE_RATE_LIMIT)
    })

    it('gets the correct ws limits', () => {
      const limit = limits.getWSLimits('amberdata', 'starter')
      expect(limit.connections).toBe(10)
      expect(limit.subscriptions).toBe(20)
    })

    it('default WS limit if no tier match', () => {
      const limit = limits.getWSLimits('amberdata', 'non-existent')
      expect(limit.connections).toBe(limits.DEFAULT_WS_CONNECTIONS)
      expect(limit.subscriptions).toBe(limits.DEFAULT_WS_SUBSCRIPTIONS)
    })

    it('default WS limit if no provider match', () => {
      const limit = limits.getWSLimits('non-existent', 'non-existent')
      expect(limit.connections).toBe(limits.DEFAULT_WS_CONNECTIONS)
      expect(limit.subscriptions).toBe(limits.DEFAULT_WS_SUBSCRIPTIONS)
    })

    afterAll(() => {
      jest.unmock(limitsJSONPath)
    })
  })

  describe('Limits JSON is properly formatted', () => {
    let limits

    beforeAll(async () => {
      limits =  await import(limitsJSONPath)
      delete limits.default
    })

    it('Limits JSON has HTTP and WS defined', async () => {
      Object.values(limits).forEach((limit: any) => {
        expect(limit).toHaveProperty('http')
        expect(limit).toHaveProperty('ws')
      })
    })

    it('Providers in limits JSON has HTTP plan defined', async () => {
      Object.values(limits).forEach((limit: any) => {
        if (Object.keys(limit.http).length > 0) {
          Object.values(limit.http).forEach((plan: any) => {
            const hasSomeRateLimit = ['rateLimit1s', 'rateLimit1m', 'rateLimit1h'].some((rate) => Object.keys(plan).includes(rate))
            expect(hasSomeRateLimit).toBe(true)
          })
        }
      })
    })

    it('Providers in limits JSON has WS plan defined', async () => {
      Object.values(limits).forEach((limit: any) => {
        if (Object.keys(limit.ws).length > 0) {
          Object.values(limit.ws).forEach((plan: any) => {
            expect(plan).toHaveProperty('connections')
            expect(plan).toHaveProperty('subscriptions')

            expect(typeof plan.connections).toBe('number')
            expect(typeof plan.subscriptions).toBe('number')
          })
        }
      })
    })
  })
})
