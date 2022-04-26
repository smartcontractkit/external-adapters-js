import { validateAddresses } from '../../src/utils/addressValidator'

describe('Correctly validates Ethereum addresses and filters duplicates', () => {
  const validChecksumAddresses = [
    { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8' },
    { address: '0x81910675DbaF69deE0fD77570BFD07f8E436386A' },
  ]

  it('Validates addresses with mixed casing and a valid checksum', () => {
    expect(validateAddresses('eth_balance', validChecksumAddresses)).toEqual(validChecksumAddresses)
  })

  it('Validates addresses containing only lower case letters', () => {
    const lowercaseAddresses = [
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8'.toLowerCase() },
      { address: '0x81910675DbaF69deE0fD77570BFD07f8E436386A'.toLowerCase() },
    ]
    expect(validateAddresses('eth_balance', lowercaseAddresses)).toEqual(validChecksumAddresses)
  })

  it('Validates an address containing only upper case letters', () => {
    const uppercaseAddresses = [
      { address: '0x' + '8288c280F35Fb8809305906C79BD075962079Dd8'.toUpperCase() },
      { address: '0x' + '81910675DbaF69deE0fD77570BFD07f8E436386A'.toUpperCase() },
    ]
    console.log(JSON.stringify(uppercaseAddresses))
    expect(validateAddresses('eth_balance', uppercaseAddresses)).toEqual(validChecksumAddresses)
  })

  it('Removes addresses with mixed casing and an invalid checksum', () => {
    const invalidChecksumAddresses = [
      { address: '0x8288C280F35Fb8809305906C79BD075962079Dd8' },
      { address: '0x81910675DbaF69dee0fD77570BFD07f8E436386A' },
    ]
    expect(validateAddresses('eth_balance', invalidChecksumAddresses)).toEqual([])
  })

  it('Removes duplicate addresses', () => {
    const invalidChecksumAddresses = [
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8' },
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8'.toLowerCase() },
    ]
    expect(validateAddresses('eth_balance', invalidChecksumAddresses)).toEqual([
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8' },
    ])
  })
})
