import { config } from '../../src/config'

describe('config', () => {
  it('marks the secret settings sensitive, the credentials required, and defaults API_ENDPOINT to production', () => {
    for (const name of [
      'AMINA_USER_ID',
      'AMINA_PASSWORD',
      'AMINA_HMAC_SECRET',
      'AMINA_AGREEMENT_NUMBER',
    ]) {
      expect(config.getSettingDebugDetails(name).required).toBe(true)
    }

    expect(config.getSettingDebugDetails('AMINA_PASSWORD').sensitive).toBe(true)
    expect(config.getSettingDebugDetails('AMINA_HMAC_SECRET').sensitive).toBe(true)
    expect(config.getSettingDebugDetails('AMINA_USER_ID').sensitive).toBe(false)
    expect(config.getSettingDebugDetails('API_ENDPOINT').default).toBe(
      'https://integration.aminagroup.io',
    )
  })
})
