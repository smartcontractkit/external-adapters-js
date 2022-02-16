import * as limits from '../../../src/lib/config/provider-limits'

const mockLimits = {
  http: {
    free: {
      rateLimit1s: 1,
      rateLimit1h: 83.33,
    },
    'on-demand': {
      rateLimit1s: 15,
      rateLimit1h: 12500,
    },
  },
  ws: {
    free: {
      connections: 1,
      subscriptions: 10,
    },
    'on-demand': {
      connections: 2,
      subscriptions: -1,
    },
    enterprise: {
      connections: 2,
      subscriptions: -1,
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
  })

  describe('Limits JSON is properly formatted', () => {
    const limits = mockLimits

    it('Limits JSON has HTTP and WS defined', async () => {
      expect(limits).toHaveProperty('http')
      expect(limits).toHaveProperty('ws')
    })

    it('Providers in limits JSON has HTTP plan defined', async () => {
      if (Object.keys(limits.http).length > 0) {
        Object.values(limits.http).forEach((plan: any) => {
          const hasSomeRateLimit = ['rateLimit1s', 'rateLimit1m', 'rateLimit1h'].some((rate) =>
            Object.keys(plan).includes(rate),
          )
          expect(hasSomeRateLimit).toBe(true)
        })
      }
    })

    it('Providers in limits JSON has WS plan defined', async () => {
      if (Object.keys(limits.ws).length > 0) {
        Object.values(limits.ws).forEach((plan: any) => {
          expect(plan).toHaveProperty('connections')
          expect(plan).toHaveProperty('subscriptions')

          expect(typeof plan.connections).toBe('number')
          expect(typeof plan.subscriptions).toBe('number')
        })
      }
    })
  })
})
