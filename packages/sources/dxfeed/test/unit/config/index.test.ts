import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config } from '../../../src/config'

// The demo REST endpoint validate fn logs a warning from config.validate(), so
// the logger factory must be set first
LoggerFactoryProvider.set()

/**
 * Spec data_source_authentication.breaking_change_env_checks, asserted through
 * the startup surface: the adapter config re-constructed from the given
 * environment (initialize + validate) — startup-time behaviour, before any
 * request or socket.
 */
const buildFromEnv = (env: Record<string, string | undefined>): void => {
  const oldEnv: Record<string, string | undefined> = { ...process.env }
  try {
    for (const [name, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    }
    // ALLOW_PLAINTEXT_WS_TEST is a test-only flag read from the environment by
    // the validate fn; the scenarios below run without it
    delete process.env.ALLOW_PLAINTEXT_WS_TEST
    config.initialize()
    config.validate()
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in oldEnv)) {
        delete process.env[key]
      }
    }
    setEnvVariables(oldEnv)
    config.initialize()
  }
}

const CREDENTIALS = { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' }
// Fake hosts only (verifier feedback test_fake_urls): the real provider host
// lives exclusively in the src/config defaults
const VALID_DXLINK_ENDPOINT = 'wss://dxfeed.invalid/dxlink-chainlink'

describe('startup breaking-change env checks (spec data_source_authentication.breaking_change_env_checks)', () => {
  it('rejects construction with a WS_API_ENDPOINT on the legacy cometd path', () => {
    expect(() =>
      buildFromEnv({ ...CREDENTIALS, WS_API_ENDPOINT: 'wss://dxfeed.invalid/chainlink/cometd' }),
    ).toThrow(/cometd/)
  })

  it('rejects construction with a WS_API_ENDPOINT carrying embedded ://user:pass@ credentials', () => {
    expect(() =>
      buildFromEnv({
        ...CREDENTIALS,
        WS_API_ENDPOINT: 'wss://user:pass@dxfeed.invalid/dxlink-chainlink',
      }),
    ).toThrow(/credentials/)
  })

  it('rejects construction with the credential pair missing (API_USERNAME and API_PASSWORD are required)', () => {
    expect(() => buildFromEnv({ WS_API_ENDPOINT: VALID_DXLINK_ENDPOINT })).toThrow(/API_USERNAME/)

    expect(() =>
      buildFromEnv({
        API_USERNAME: CREDENTIALS.API_USERNAME,
        WS_API_ENDPOINT: VALID_DXLINK_ENDPOINT,
      }),
    ).toThrow(/API_PASSWORD/)

    expect(() =>
      buildFromEnv({
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: VALID_DXLINK_ENDPOINT,
      }),
    ).toThrow(/API_USERNAME/)
  })

  it('accepts construction with a clean wss:// dxLink endpoint and both credentials', () => {
    expect(() =>
      buildFromEnv({ ...CREDENTIALS, WS_API_ENDPOINT: VALID_DXLINK_ENDPOINT }),
    ).not.toThrow()
  })
})
