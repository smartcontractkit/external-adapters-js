import { config } from '../../src/config'
import { mockLogger } from './fixtures'

// validate fns (sandbox warnings) log at settings build; the framework requires the logger
// factory to be set before any logging call
const logger = mockLogger()

// Spec external_adapter_specifications.environment_variables
describe('config', () => {
  const oldEnv = { ...process.env }

  beforeEach(() => {
    process.env['CLIENT_ID'] = 'fake-client-id'
    process.env['CLIENT_SECRET'] = 'fake-client-secret'
    delete process.env['AUTH_ENDPOINT']
    delete process.env['WS_API_ENDPOINT']
  })

  afterAll(() => {
    process.env = oldEnv
  })

  it('config requires CLIENT_ID and CLIENT_SECRET, marks both sensitive, and applies sandbox defaults for AUTH_ENDPOINT and WS_API_ENDPOINT', () => {
    const definitions = config['settingsDefinition'] as Record<
      string,
      { required?: boolean; sensitive?: boolean; default?: unknown }
    >

    expect(definitions.CLIENT_ID).toMatchObject({ required: true, sensitive: true })
    expect(definitions.CLIENT_SECRET).toMatchObject({ required: true, sensitive: true })
    expect(definitions.AUTH_ENDPOINT.default).toBe('https://authx.alpaca.markets/v1/oauth2/token')
    expect(definitions.WS_API_ENDPOINT.default).toBe(
      'wss://stream.data.alpaca.markets/v1beta1/overnight',
    )
  })

  // Spec environment_variables lists exactly four settings; owner decision reconnect_backoff=cut
  // adds no reconnect/backoff settings, and reference defect 4 used API_KEY
  it('defines exactly the four spec settings', () => {
    expect(Object.keys(config['settingsDefinition']).sort()).toEqual([
      'AUTH_ENDPOINT',
      'CLIENT_ID',
      'CLIENT_SECRET',
      'WS_API_ENDPOINT',
    ])
  })

  it('config loads with spec defaults', () => {
    config.initialize()
    config.validate()
    expect(config.settings.AUTH_ENDPOINT).toBe('https://authx.alpaca.markets/v1/oauth2/token')
    expect(config.settings.WS_API_ENDPOINT).toBe(
      'wss://stream.data.alpaca.markets/v1beta1/overnight',
    )
  })

  it('passes validation with CLIENT_ID and CLIENT_SECRET set', () => {
    config.initialize()
    expect(() => config.validate()).not.toThrow()
    expect(config.settings.CLIENT_ID).toBe('fake-client-id')
    expect(config.settings.CLIENT_SECRET).toBe('fake-client-secret')
  })

  it.each(['CLIENT_ID', 'CLIENT_SECRET'])(
    'fails to start without CLIENT_ID or CLIENT_SECRET (%s missing)',
    (name) => {
      delete process.env[name]
      config.initialize()
      expect(() => config.validate()).toThrow(name)
    },
  )

  it.each(['CLIENT_ID', 'CLIENT_SECRET'])('%s is sensitive', (name) => {
    config.initialize()
    expect(config.getSettingDebugDetails(name).sensitive).toBe(true)
  })

  // Reference defect 4: tests set API_KEY while the adapter needs CLIENT_ID and CLIENT_SECRET
  it('defines no API_KEY setting', () => {
    config.initialize()
    expect(config.settings).not.toHaveProperty('API_KEY')
  })

  // Spec AUTH_ENDPOINT / WS_API_ENDPOINT descriptions: production hosts replace the sandbox hosts
  it('accepts production AUTH_ENDPOINT and WS_API_ENDPOINT overrides', () => {
    process.env['AUTH_ENDPOINT'] = 'https://authx.fake-alt.test/v1/oauth2/token'
    process.env['WS_API_ENDPOINT'] = 'wss://stream.data.fake-alt.test/v1beta1/overnight'
    expect(() => {
      config.initialize()
      config.validate()
    }).not.toThrow()
    expect(config.settings.AUTH_ENDPOINT).toBe('https://authx.fake-alt.test/v1/oauth2/token')
    expect(config.settings.WS_API_ENDPOINT).toBe(
      'wss://stream.data.fake-alt.test/v1beta1/overnight',
    )
  })
})
