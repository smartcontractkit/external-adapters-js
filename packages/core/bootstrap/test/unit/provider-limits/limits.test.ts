import * as limits from '../../../src/lib/config/provider-limits'

const limitsJSONPath = '../../../src/lib/config/provider-limits/limits.json'

const mockLimits = {
  amberdata: {
    http: {
      starter: {
        rateLimit1h: 10,
      },
      premium: {
        rateLimit1h: 20,
      },
      business: {
        rateLimit1h: 30,
      },
    },
    ws: {
      starter: {
        connections: 10,
        subscriptions: 20,
      },
    },
  },
}

describe('Provider Limits', () => {
  describe('Limits API', () => {
    it('gets the correct rate limits', () => {
      const limit = limits.getRateLimit('amberdata', mockLimits, 'free')
      expect(limit.minute).toBe(83.33 / 60)
      expect(limit.second).toBe(1)
    })

    it('rate limit defaults to lowest tier if no tier match', () => {
      const limit = limits.getRateLimit('amberdata', mockLimits, 'non-existant')
      expect(limit.minute).toBe(83.33 / 60)
      expect(limit.second).toBe(1)
    })

    it('rate limit throws if no provider match', () => {
      expect(() => {
        limits.getRateLimit('non-existent', mockLimits, 'non-existent')
      }).toThrow(Error)
    })

    it('gets the correct ws limits', () => {
      const limit = limits.getWSLimits('amberdata', mockLimits, 'free')
      expect(limit.connections).toBe(1)
      expect(limit.subscriptions).toBe(10)
    })

    it('WS defaults to lowest tier if no tier match', () => {
      const limit = limits.getWSLimits('amberdata', mockLimits, 'non-existant')
      expect(limit.connections).toBe(1)
      expect(limit.subscriptions).toBe(10)
    })

    it('WS limit throws if no provider match', () => {
      expect(() => {
        limits.getWSLimits('non-existent', mockLimits, 'non-existent')
      }).toThrow(Error)
    })

    afterAll(() => {
      jest.unmock(limitsJSONPath)
    })
  })

  describe('Limits JSON is properly formatted', () => {
    let limits

    beforeAll(async () => {
      limits = await import(limitsJSONPath)
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
            const hasSomeRateLimit = ['rateLimit1s', 'rateLimit1m', 'rateLimit1h'].some((rate) =>
              Object.keys(plan).includes(rate),
            )
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
