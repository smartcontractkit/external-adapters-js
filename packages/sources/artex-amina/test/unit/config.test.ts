const REQUIRED_ENV = {
  API_ENDPOINT: 'https://amina.test',
  AMINA_USER_ID: '25742014',
  AMINA_PASSWORD: 'password',
  AMINA_HMAC_SECRET: 'hmac-secret',
  AMINA_AGREEMENT_NUMBER: '157769',
}

function setEnv(overrides: Record<string, string | undefined> = {}): void {
  Object.assign(process.env, REQUIRED_ENV, overrides)
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
    }
  }
}

function clearEnv(): void {
  for (const key of Object.keys(REQUIRED_ENV)) {
    delete process.env[key]
  }
}

describe('AMINA config', () => {
  beforeEach(() => {
    jest.resetModules()
    clearEnv()
    setEnv()
  })

  afterEach(() => {
    clearEnv()
    jest.resetModules()
  })

  it('loads the required settings and framework overrides', async () => {
    const { config } = await import('../../src/config')
    config.initialize()
    config.validate()

    expect(config.settings.API_ENDPOINT).toBe('https://amina.test')
    expect(config.settings.AMINA_USER_ID).toBe('25742014')
    expect(config.settings.AMINA_USER_AGENT).toBe('chainlink-artex-amina-adapter/1.0.0')
    expect(config.settings.MAX_ATTEMPTS).toBe(3)
    expect(config.settings.CACHE_MAX_AGE).toBe(60 * 60 * 1000)
    expect(config.settings.WARMUP_SUBSCRIPTION_TTL).toBe(60 * 60 * 1000)
    expect(config.settings.BACKGROUND_EXECUTE_TIMEOUT).toBe(9 * 60 * 1000)
    expect(config.settings.RETRY).toBe(0)
  })

  it('rejects a user ID that is not eight digits', async () => {
    setEnv({ AMINA_USER_ID: '123' })
    const { config } = await import('../../src/config')

    expect(() => {
      config.initialize()
      config.validate()
    }).toThrow()
  })
})
