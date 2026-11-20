import { censor } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { config } from '../../src/config'

const CLIENT_ID_VALUE = 'probe-client-id-value'
const API_KEY_VALUE = 'probe-apikey-value'

const ENV_KEYS = ['SPGI_CLIENT_ID', 'SPGI_APIKEY']

describe('probe: trace-level secret logging', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    oldEnv = { ...process.env }
    process.env.SPGI_CLIENT_ID = CLIENT_ID_VALUE
    process.env.SPGI_APIKEY = API_KEY_VALUE
    config.initialize()
    config.buildCensorList()
  })

  afterAll(() => {
    CensorList.set([])
    ENV_KEYS.forEach((key) => {
      if (oldEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = oldEnv[key]
      }
    })
  })

  it('redacts the client id and apikey from a trace-level payload', () => {
    expect(config.getSettingDebugDetails('SPGI_CLIENT_ID').sensitive).toBe(true)
    expect(config.getSettingDebugDetails('SPGI_APIKEY').sensitive).toBe(true)

    const tracePayload = {
      request: {
        headers: {
          Authorization: `Basic ${CLIENT_ID_VALUE}`,
          apikey: API_KEY_VALUE,
        },
      },
    }

    const logged = JSON.stringify(censor(tracePayload, CensorList.getAll()))

    expect(logged).not.toContain(CLIENT_ID_VALUE)
    expect(logged).not.toContain(API_KEY_VALUE)
    expect(logged).toContain('[SPGI_CLIENT_ID REDACTED]')
    expect(logged).toContain('[SPGI_APIKEY REDACTED]')
  })
})
