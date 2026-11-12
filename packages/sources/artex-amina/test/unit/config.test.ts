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
  delete process.env.RETRY
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

  it('applies the nonce-safe retry and background timeout defaults', async () => {
    const { config } = await import('../../src/config')
    config.initialize()
    config.validate()

    expect(config.settings).toMatchObject({
      RETRY: 0,
      BACKGROUND_EXECUTE_TIMEOUT: 300_000,
      CACHE_MAX_AGE: 3_600_000,
      WARMUP_SUBSCRIPTION_TTL: 3_600_000,
    })
  })

  it('defaults to the production endpoint', async () => {
    setEnv({ API_ENDPOINT: undefined })
    const { config } = await import('../../src/config')
    config.initialize()
    config.validate()

    expect(config.settings.API_ENDPOINT).toBe('https://integration.aminagroup.io')
  })

  it('rejects a user ID that is too short', async () => {
    setEnv({ AMINA_USER_ID: '1234567' })
    const { config } = await import('../../src/config')

    expect(() => {
      config.initialize()
      config.validate()
    }).toThrow(/8-digit/)
  })

  it('rejects a nonzero framework RETRY at startup', async () => {
    process.env.RETRY = '1'
    const { adapter } = await import('../../src')

    await expect(adapter.initialize({} as never)).rejects.toThrow('AMINA requires RETRY=0')
  })
})
