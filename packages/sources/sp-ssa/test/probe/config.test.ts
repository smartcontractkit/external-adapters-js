import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config } from '../../src/config'

const settings = ['API_ENDPOINT', 'AUTH_ENDPOINT', 'CLIENT_ID', 'API_KEY', 'ORIGIN'] as const

const requiredSettings = ['API_ENDPOINT', 'AUTH_ENDPOINT', 'CLIENT_ID', 'API_KEY'] as const

const restoreEnv = (oldEnv: NodeJS.ProcessEnv) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in oldEnv)) {
      delete process.env[key]
    }
  }
  setEnvVariables(oldEnv)
}

describe('config', () => {
  const oldEnv = { ...process.env }

  beforeEach(() => {
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.AUTH_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.ORIGIN = 'node-origin'
    delete process.env.API_TIMEOUT
    delete process.env.RETRY
  })

  afterAll(() => {
    restoreEnv(oldEnv)
  })

  it('initializes with the five settings and the shipped overrides', () => {
    config.initialize()
    config.validate()

    for (const setting of settings) {
      expect(config.settings[setting]).toBeDefined()
    }
    expect(config.settings.API_TIMEOUT).toBe(10_000)
    expect(config.settings.RETRY).toBe(0)
  })

  it.each(requiredSettings)('fails startup when %s is missing', (setting) => {
    delete process.env[setting]

    expect(() => {
      config.initialize()
      config.validate()
    }).toThrow(new RegExp(setting))
  })
})
