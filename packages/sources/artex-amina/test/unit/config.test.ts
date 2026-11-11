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

  const invalidSettings: Array<[string, Record<string, string>, RegExp]> = [
    ['a non-HTTPS endpoint', { API_ENDPOINT: 'http://amina.test' }, /HTTPS/],
    ['an unparseable endpoint', { API_ENDPOINT: 'not-a-url' }, /HTTPS/],
    ['an endpoint with a path', { API_ENDPOINT: 'https://amina.test/api/b2c/v1' }, /origin/],
    ['a user ID that is too short', { AMINA_USER_ID: '1234567' }, /8-digit/],
  ]

  it.each(invalidSettings)('rejects %s', async (_, overrides, message) => {
    setEnv(overrides)
    const { config } = await import('../../src/config')

    expect(() => {
      config.initialize()
      config.validate()
    }).toThrow(message)
  })

  it('rejects a nonzero framework RETRY at startup', async () => {
    process.env.RETRY = '1'
    const { adapter } = await import('../../src')

    await expect(adapter.initialize({} as never)).rejects.toThrow('AMINA requires RETRY=0')
  })
})
