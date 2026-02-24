import { HEALTH_ENDPOINTS, Networks } from '../../src/config'

describe('config', () => {
  describe('HEALTH_ENDPOINTS processResponse', () => {
    describe('Scroll', () => {
      const processResponse = HEALTH_ENDPOINTS[Networks.Scroll].processResponse

      it('returns true when data.health equals 1', () => {
        const data = { data: { health: 1 } }
        expect(processResponse(data)).toBe(true)
      })

      it('returns false when data.health equals 0', () => {
        const data = { data: { health: 0 } }
        expect(processResponse(data)).toBe(false)
      })

      it('returns false when data.health is missing', () => {
        const data = { data: {} }
        expect(processResponse(data)).toBe(false)
      })

      it('returns false when data is empty', () => {
        const data = {}
        expect(processResponse(data)).toBe(false)
      })
    })

    describe('Metis', () => {
      const processResponse = HEALTH_ENDPOINTS[Networks.Metis].processResponse

      it('returns true when healthy is truthy', () => {
        const data = { healthy: true }
        expect(processResponse(data)).toBe(true)
      })

      it('returns true when healthy is a truthy string', () => {
        const data = { healthy: 'yes' }
        expect(processResponse(data)).toBe(true)
      })

      it('returns false when healthy is false', () => {
        const data = { healthy: false }
        expect(processResponse(data)).toBe(false)
      })

      it('returns false when healthy is missing', () => {
        const data = {}
        expect(processResponse(data)).toBe(false)
      })
    })

    describe('networks without health endpoints', () => {
      const networksWithoutEndpoints = [
        Networks.Arbitrum,
        Networks.Optimism,
        Networks.Base,
        Networks.Linea,
        Networks.Starkware,
        Networks.zkSync,
        Networks.Ink,
        Networks.Mantle,
        Networks.Unichain,
        Networks.Soneium,
        Networks.Celo,
        Networks.Xlayer,
        Networks.Megaeth,
        Networks.Katana,
      ]

      networksWithoutEndpoints.forEach((network) => {
        it(`${network} processResponse returns undefined`, () => {
          expect(HEALTH_ENDPOINTS[network].processResponse({})).toBe(undefined)
        })
      })
    })
  })
})
