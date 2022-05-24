import { validateAddresses, filterDuplicates } from '../../src/utils/addressValidator'

describe('Validates Ethereum addresses and filters duplicates', () => {
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
    expect(filterDuplicates(validateAddresses('eth_balance', invalidChecksumAddresses))).toEqual([
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8' },
    ])
  })
})

describe('Validates Bitcoin addresses and filters duplicates', () => {
  it('Validates valid base58 Bitcoin addresses', () => {
    const validBase58Addresses = [
      { address: '1AnwDVbwsLBVwRfqN2x9Eo4YEJSPXo2cwG', network: 'bitcoin', chainId: 'mainnet' },
      { address: '385cR5DM96n1HvBDMzLHPYcw89fZAXULJP', network: 'bitcoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('bitcoin_json_rpc', validBase58Addresses)).toEqual(
      validBase58Addresses,
    )
  })

  it('Does not validate invalid base58 address', () => {
    const invalidBase58Addresses = [
      { address: '1AnwDVbwsLBVwRfqN2x9Eo4YEJSPXo2cw0', network: 'bitcoin', chainId: 'mainnet' },
      { address: '385cR5DM96n1HvBDMzLHPYcw89fZAXULJ0', network: 'bitcoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('bitcoin_json_rpc', invalidBase58Addresses)).toEqual([])
  })

  const validBech32Address = [
    {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      network: 'bitcoin',
      chainId: 'mainnet',
    },
  ]
  it('Validates valid bech32 Bitcoin addresses', () => {
    expect(validateAddresses('bitcoin_json_rpc', validBech32Address)).toEqual(validBech32Address)
  })

  it('Validates valid bech32 Bitcoin address with upper case characters', () => {
    const validBech32AddressWithUppercase = [
      {
        address: 'bc1qar0SRRR7XFKVY5l643lydnw9RE59gtzzwf5mdq',
        network: 'bitcoin',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('bitcoin_json_rpc', validBech32AddressWithUppercase)).toEqual(
      validBech32Address,
    )
  })

  it('Does not validate invalid bech32 Bitcoin addresses', () => {
    const invalidBech32Address = [
      {
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5m11',
        network: 'bitcoin',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('eth_balance', invalidBech32Address)).toEqual([])
  })

  it('Removes duplicate addresses', () => {
    const duplicateBech32Address = [
      {
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        network: 'bitcoin',
        chainId: 'mainnet',
      },
      {
        address: 'bc1qar0sRRR7xfkvy5l643lydnw9re59gtzzwf5mdq',
        network: 'bitcoin',
        chainId: 'mainnet',
      },
    ]
    expect(filterDuplicates(validateAddresses('bitcoin_json_rpc', duplicateBech32Address))).toEqual(
      [
        {
          address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
          network: 'bitcoin',
          chainId: 'mainnet',
        },
      ],
    )
  })
})

describe('Validates Cardano addresses', () => {
  it('Validates valid base58 addresses', () => {
    const validBase58Address = [
      {
        address:
          '37btjrVyb4KDXBNC4haBVPCrro8AQPHwvCMp3RFhhSVWwfFmZ6wwzSK6JK1hY6wHNmtrpTf1kdbva8TCneM2YsiXT7mrzT21EacHnPpz5YyUdj64na',
        network: 'cardano',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('cardano', validBase58Address)).toEqual(validBase58Address)
  })

  it('Does not validate invalid base58 address', () => {
    const invalidBase58Address = [
      {
        address:
          '37OtjrVyb4KDXBNC4haBVPCrro8AQPHwvCMp3RFhhSVWwfFmZ6wwzSK6JK1hY6wHNmtrpTf1kdbva8TCneM2YsiXT7mrzT21EacHnPpz5YyUdj64na',
        network: 'cardano',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('cardano', invalidBase58Address)).toEqual([])
  })

  const validBech32Address = [
    {
      address: 'addr1vpu5vlrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w',
      network: 'cardano',
      chainId: 'mainnet',
    },
  ]
  it('Validates valid bech32 addresses', () => {
    expect(validateAddresses('cardano', validBech32Address)).toEqual(validBech32Address)
  })

  it('Validates valid bech32 address with upper case characters', () => {
    const validBech32AddressWithUppercase = [
      {
        address: 'ADDR1VPU5vlrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w',
        network: 'cardano',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('cardano', validBech32AddressWithUppercase)).toEqual(
      validBech32Address,
    )
  })

  it('Does not validate invalid bech32 addresses', () => {
    const invalidBech32Address = [
      {
        address: 'stake1vpu5vlrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w',
        network: 'cardano',
        chainId: 'mainnet',
      },
      {
        address: 'addr1vpu5Olrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w',
        network: 'cardano',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('cardano', invalidBech32Address)).toEqual([])
  })
})

describe('Validates Dogecoin addresses', () => {
  it('Validates valid address', () => {
    const validAddress = [
      { address: 'DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD', network: 'dogecoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('bitcoin_json_rpc', validAddress)).toEqual(validAddress)
  })

  it('Does not validate invalid address', () => {
    const invalidBase58Addresses = [
      { address: 'DBXu2kgc3OtvCUWFcxFE3r9hEYgmuaaCyD', network: 'dogecoin', chainId: 'mainnet' },
      { address: 'BBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD', network: 'dogecoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('bitcoin_json_rpc', invalidBase58Addresses)).toEqual([])
  })
})
