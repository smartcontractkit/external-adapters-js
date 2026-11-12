import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { resolveStreamMaxAgeSeconds, settingsDefinition } from '../../src/config'

// Config schema + resolution for the DS_VALID_MAX_AGE_SECONDS family.

describe('config: DS_VALID_MAX_AGE_SECONDS', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    delete process.env.DS_VALID_MAX_AGE_SECONDS
    delete process.env.DS_VALID_MAX_AGE_SECONDS_REGULAR
    delete process.env.DS_VALID_MAX_AGE_SECONDS_EXTENDED
    delete process.env.DS_VALID_MAX_AGE_SECONDS_OVERNIGHT
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  const buildSettings = () => {
    // Fresh AdapterConfig over the real definitions, so this test exercises the
    // committed schema without module-reload tricks.
    const cfg = new AdapterConfig({
      ...settingsDefinition,
    })
    cfg.initialize()
    return cfg.settings as Record<string, unknown>
  }

  it('parses numeric values from the environment', () => {
    process.env.DS_VALID_MAX_AGE_SECONDS = '45'
    process.env.DS_VALID_MAX_AGE_SECONDS_REGULAR = '5'

    const settings = buildSettings()

    expect(settings.DS_VALID_MAX_AGE_SECONDS).toEqual(45)
    expect(settings.DS_VALID_MAX_AGE_SECONDS_REGULAR).toEqual(5)
  })

  it('is undefined when unset (check disabled)', () => {
    const settings = buildSettings()

    expect(settings.DS_VALID_MAX_AGE_SECONDS).toBeUndefined()
    expect(settings.DS_VALID_MAX_AGE_SECONDS_REGULAR).toBeUndefined()
    expect(settings.DS_VALID_MAX_AGE_SECONDS_EXTENDED).toBeUndefined()
    expect(settings.DS_VALID_MAX_AGE_SECONDS_OVERNIGHT).toBeUndefined()
  })
})

describe('resolveStreamMaxAgeSeconds', () => {
  const settings = (values: Record<string, number | undefined>) => values as never

  it('returns undefined per stream when nothing is configured', () => {
    expect(resolveStreamMaxAgeSeconds(settings({}))).toEqual({
      regular: undefined,
      extended: undefined,
      overnight: undefined,
    })
  })

  it('applies the shared default to all sessions', () => {
    expect(resolveStreamMaxAgeSeconds(settings({ DS_VALID_MAX_AGE_SECONDS: 300 }))).toEqual({
      regular: 300,
      extended: 300,
      overnight: 300,
    })
  })

  it('per-session overrides beat the shared default', () => {
    expect(
      resolveStreamMaxAgeSeconds(
        settings({ DS_VALID_MAX_AGE_SECONDS: 300, DS_VALID_MAX_AGE_SECONDS_OVERNIGHT: 900 }),
      ),
    ).toEqual({ regular: 300, extended: 300, overnight: 900 })
  })

  it('supports an override without a shared default', () => {
    expect(resolveStreamMaxAgeSeconds(settings({ DS_VALID_MAX_AGE_SECONDS_REGULAR: 30 }))).toEqual({
      regular: 30,
      extended: undefined,
      overnight: undefined,
    })
  })

  it('treats 0 as disabled', () => {
    expect(resolveStreamMaxAgeSeconds(settings({ DS_VALID_MAX_AGE_SECONDS: 0 }))).toEqual({
      regular: undefined,
      extended: undefined,
      overnight: undefined,
    })
  })
})

describe('config: SESSION_START_GATING_ENABLED', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    delete process.env.SESSION_START_GATING_ENABLED
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  const buildSettings = () => {
    const cfg = new AdapterConfig({
      ...settingsDefinition,
    })
    cfg.initialize()
    return cfg.settings as Record<string, unknown>
  }

  it('defaults to false (disabled)', () => {
    expect(buildSettings().SESSION_START_GATING_ENABLED).toEqual(false)
  })

  it('parses boolean values from the environment', () => {
    process.env.SESSION_START_GATING_ENABLED = 'true'
    expect(buildSettings().SESSION_START_GATING_ENABLED).toEqual(true)

    process.env.SESSION_START_GATING_ENABLED = 'false'
    expect(buildSettings().SESSION_START_GATING_ENABLED).toEqual(false)
  })
})

describe('config: ALLOW_MARKET_SESSION_OVERRIDE', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    delete process.env.ALLOW_MARKET_SESSION_OVERRIDE
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  const buildSettings = () => {
    const cfg = new AdapterConfig({
      ...settingsDefinition,
    })
    cfg.initialize()
    return cfg.settings as Record<string, unknown>
  }

  it('defaults to false (disabled)', () => {
    expect(buildSettings().ALLOW_MARKET_SESSION_OVERRIDE).toEqual(false)
  })

  it('parses boolean values from the environment', () => {
    process.env.ALLOW_MARKET_SESSION_OVERRIDE = 'true'
    expect(buildSettings().ALLOW_MARKET_SESSION_OVERRIDE).toEqual(true)

    process.env.ALLOW_MARKET_SESSION_OVERRIDE = 'false'
    expect(buildSettings().ALLOW_MARKET_SESSION_OVERRIDE).toEqual(false)
  })

  it('treats any string other than true as false', () => {
    process.env.ALLOW_MARKET_SESSION_OVERRIDE = 'yes'
    expect(buildSettings().ALLOW_MARKET_SESSION_OVERRIDE).toEqual(false)
  })
})
