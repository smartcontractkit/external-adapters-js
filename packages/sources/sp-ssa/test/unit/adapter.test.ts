import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'

const restoreEnv = (oldEnv: NodeJS.ProcessEnv) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in oldEnv)) {
      delete process.env[key]
    }
  }
  setEnvVariables(oldEnv)
}

describe('adapter configuration', () => {
  const oldEnv = { ...process.env }

  beforeAll(() => {
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.AUTH_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    delete process.env.ORIGIN
  })

  afterAll(() => {
    restoreEnv(oldEnv)
  })

  it('declares the provider rate tier for each EA instance', async () => {
    const { adapter } = await import('../../src')
    const tier = adapter.rateLimiting?.tiers?.default
    expect(tier?.rateLimit1m).toBe(300)
    expect(tier?.note).toContain('each EA instance')
    expect(tier?.note).toContain('not across the DON')
  })

  it('marks the credentials sensitive and keeps the token URL public', async () => {
    const { config } = await import('../../src/config')
    expect(config.getSettingDebugDetails('CLIENT_ID')).toMatchObject({ sensitive: true })
    expect(config.getSettingDebugDetails('API_KEY')).toMatchObject({ sensitive: true })
    expect(config.getSettingDebugDetails('AUTH_ENDPOINT')).toMatchObject({
      type: 'string',
      required: true,
      sensitive: false,
    })
  })
})
