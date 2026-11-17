import { config } from '../../src/config'

describe('config', () => {
  it.each([
    ['AMINA_PASSWORD', true],
    ['AMINA_HMAC_SECRET', true],
    ['AMINA_USER_ID', false],
    ['AMINA_AGREEMENT_NUMBER', false],
    ['AMINA_PORTFOLIO', false],
    ['AMINA_ISIN', false],
    ['API_ENDPOINT', false],
  ])('declares %s sensitive as %s', (setting, sensitive) => {
    expect(config.getSettingDebugDetails(setting).sensitive).toBe(sensitive)
  })
})
