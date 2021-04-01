import * as ratelimits from '../../src/index'
import Limits from '../../src/limits.json'
const limits: Record<string, any> = Limits // ugly solution to dynamically reference JSON properties

describe('ratelimits', () => {
  describe('all provider tiers are working', () => {
    for (const [provider, tiers] of Object.entries(limits)) {
      it(`${provider} outputs ProviderRateLimits without errors`, () => {
        tiers.forEach(function (tier: ratelimits.DeclaredTier, index: number) {
          let limits = ratelimits.getRateLimit(provider, index)
          expect(limits?.burst).toBeGreaterThan(0)
          expect(limits?.quota).toBeGreaterThan(0)
          limits = ratelimits.getRateLimit(provider, tier.tierName)
          expect(limits?.burst).toBeGreaterThan(0)
          expect(limits?.quota).toBeGreaterThan(0)
        })
      })
    }
  })
  // test below commented out until we decide how to handle providers without declared limits

  // context('all providers have at least one tier declared', () => {
  //   for (const [provider, tiers] of Object.entries(limits)) {
  //     it(`${provider} has tiers defined`, () => {
  //       expect(tiers, `${provider} needs to define at least one tier`).to.not.be.empty
  //     })
  //   }
  // })
})
