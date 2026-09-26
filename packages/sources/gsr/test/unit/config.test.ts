import { config } from '../../src/config'

// Framework default, from BaseSettingsDefinition. Duplicated rather than
// imported so that a change to it upstream fails this test loudly.
const CACHE_MAX_AGE_DEFAULT_MS = 90_000

describe('WS_SUBSCRIPTION_UNRESPONSIVE_TTL override', () => {
  const ttl = config.options?.envDefaultOverrides?.WS_SUBSCRIPTION_UNRESPONSIVE_TTL

  it('is lowered from the 120s framework default', () => {
    // At 120s the framework notices a stalled GSR session only after cached
    // prices have already aged out, which is what DF-26076 was.
    expect(ttl).toEqual(30_000)
  })

  it('leaves room to reconnect before cached prices age out', () => {
    // Detection plus a reconnect has to fit inside CACHE_MAX_AGE, otherwise
    // callers see 504s while the adapter is recovering.
    expect(ttl).toBeLessThan(CACHE_MAX_AGE_DEFAULT_MS)
  })

  it('stays within the range the framework accepts', () => {
    expect(ttl).toBeGreaterThanOrEqual(1_000)
    expect(ttl).toBeLessThanOrEqual(180_000)
  })
})
