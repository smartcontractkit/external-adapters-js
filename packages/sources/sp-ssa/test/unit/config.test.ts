import { adapter } from '../../src'
import { config } from '../../src/config'

const ENV_KEYS = [
  'API_ENDPOINT',
  'AUTH_API_ENDPOINT',
  'RATE_LIMIT_CAPACITY_MINUTE',
  'SPGI_CLIENT_ID',
  'SPGI_APIKEY',
]

const UAT_API_ENDPOINT = 'https://api.use1.uat.ratings.spglobal.com/ssa-defiscoreapi/extoauthv2'
const UAT_AUTH_ENDPOINT = 'https://secureapi.signinpreview.spglobal.com/gettoken/token'

describe('adapter config', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    oldEnv = { ...process.env }
    ENV_KEYS.forEach((key) => delete process.env[key])
  })

  afterAll(() => {
    ENV_KEYS.forEach((key) => {
      if (oldEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = oldEnv[key]
      }
    })
  })

  it('defaults API_ENDPOINT and AUTH_API_ENDPOINT to the recorded UAT URLs', () => {
    config.initialize()

    expect(config.settings.API_ENDPOINT).toBe(UAT_API_ENDPOINT)
    expect(config.settings.AUTH_API_ENDPOINT).toBe(UAT_AUTH_ENDPOINT)
  })

  it('declares SPGI_CLIENT_ID and SPGI_APIKEY as required sensitive settings', () => {
    const clientId = config.getSettingDebugDetails('SPGI_CLIENT_ID')
    const apiKey = config.getSettingDebugDetails('SPGI_APIKEY')

    expect(clientId).toMatchObject({ required: true, sensitive: true, default: undefined })
    expect(apiKey).toMatchObject({ required: true, sensitive: true, default: undefined })
  })

  it('paces provider requests at 300 each minute', () => {
    expect(config.options?.envDefaultOverrides?.RATE_LIMIT_CAPACITY_MINUTE).toBe(300)
    expect(adapter.rateLimiting?.tiers.default.rateLimit1m).toBe(300)
  })
})
