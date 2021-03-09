import { expect } from 'chai'
import Limits from '../src/limits.json'
import * as ratelimits from '../src/index'
const limits: Record<string, any> = Limits // ugly solution to dynamically reference JSON properties

describe('ratelimits', () => {
  context('all provider tiers are working', () => {
    for (const [provider, tiers] of Object.entries(limits)) {
      it(`${provider} outputs ProviderRateLimits without errors`, () => {
        tiers.forEach(function (tier: ratelimits.DeclaredTier, index: number) {
          let limits = ratelimits.getRateLimit(provider, index, undefined)
          expect(limits.burst).to.be.above(0)
          expect(limits.quota).to.be.above(0)
          limits = ratelimits.getRateLimit(provider, undefined, tier.tierName)
          expect(limits.burst).to.be.above(0)
          expect(limits.quota).to.be.above(0)
        })
      })
    }
  })
  context('all providers have at least one tier declared', () => {
    for (const [provider, tiers] of Object.entries(limits)) {
      it(`${provider} has tiers defined`, () => {
        expect(tiers, `${provider} needs to define at least one tier`).to.not.be.empty
      })
    }
  })
})
