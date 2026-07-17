import { config } from '../../src/config'
import {
  decodeRootToDecimal,
  doTrizeCustomInputValidation,
  getTrizeApiEndpoint,
  normalizeContractIdToDecimal,
} from '../../src/utils/t-rize-common'

const settings = {
  API_ENDPOINT: 'https://mainnet.example/current-root',
  TESTNET_API_ENDPOINT: 'https://testnet.example/current-root',
} as typeof config.settings

describe('T-Rize common utilities', () => {
  it('selects the endpoint for the requested network', () => {
    expect(getTrizeApiEndpoint('mainnet', settings)).toBe(settings.API_ENDPOINT)
    expect(getTrizeApiEndpoint('testnet', settings)).toBe(settings.TESTNET_API_ENDPOINT)
  })

  it('rejects a missing selected endpoint', () => {
    expect(() =>
      doTrizeCustomInputValidation('testnet', {
        ...settings,
        TESTNET_API_ENDPOINT: '',
      }),
    ).toThrow('Error: missing environment variable TESTNET_API_ENDPOINT')
  })

  it('decodes and truncates a root to a decimal string', () => {
    const root = Buffer.from(`${'ff'.repeat(24)}${'00'.repeat(8)}`, 'hex').toString('base64')

    expect(decodeRootToDecimal(root)).toBe(
      '24519928653854221733733552434404946937899825954937634815',
    )
  })

  it('rejects an invalid root', () => {
    expect(() => decodeRootToDecimal('!not-base64!')).toThrow(
      'Unable to decode root: invalid base64 value "!not-base64!".',
    )
  })

  it('normalizes a contract ID to a decimal string', () => {
    expect(normalizeContractIdToDecimal('0XAbCd')).toBe('43981')
  })

  it('rejects an invalid contract ID', () => {
    expect(() => normalizeContractIdToDecimal('xyz123')).toThrow(
      'Unable to normalize contractId: invalid hex value "xyz123".',
    )
  })
})
