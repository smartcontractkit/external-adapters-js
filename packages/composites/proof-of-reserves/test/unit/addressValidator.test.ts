import { validateAddresses, filterDuplicates } from '../../src/utils/addressValidator'

describe('Validates Ethereum addresses and filters duplicates', () => {
  const validChecksumAddresses = [
    { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8' },
    { address: '0x81910675DbaF69deE0fD77570BFD07f8E436386A' },
  ]

  it('Validates addresses with mixed casing and a valid checksum', () => {
    expect(validateAddresses('1', 'eth_balance', validChecksumAddresses)).toEqual(
      validChecksumAddresses,
    )
  })

  it('Validates addresses containing only lower case letters', () => {
    const lowercaseAddresses = [
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8'.toLowerCase() },
      { address: '0x81910675DbaF69deE0fD77570BFD07f8E436386A'.toLowerCase() },
    ]
    expect(validateAddresses('1', 'eth_balance', lowercaseAddresses)).toEqual(
      validChecksumAddresses,
    )
  })

  it('Validates an address containing only upper case letters', () => {
    const uppercaseAddresses = [
      { address: '0x' + '8288c280F35Fb8809305906C79BD075962079Dd8'.toUpperCase() },
      { address: '0x' + '81910675DbaF69deE0fD77570BFD07f8E436386A'.toUpperCase() },
    ]
    expect(validateAddresses('1', 'eth_balance', uppercaseAddresses)).toEqual(
      validChecksumAddresses,
    )
  })

  it('Removes addresses with mixed casing and an invalid checksum', () => {
    const invalidChecksumAddresses = [
      { address: '0x8288C280F35Fb8809305906C79BD075962079Dd8' },
      { address: '0x81910675DbaF69dee0fD77570BFD07f8E436386A' },
    ]
    expect(validateAddresses('1', 'eth_balance', invalidChecksumAddresses)).toEqual([])
  })

  it('Removes duplicate addresses', () => {
    const invalidChecksumAddresses = [
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8' },
      { address: '0x8288c280F35Fb8809305906C79BD075962079Dd8'.toLowerCase() },
    ]
    expect(
      filterDuplicates('1', validateAddresses('1', 'eth_balance', invalidChecksumAddresses)),
    ).toEqual([{ address: '0x8288c280F35Fb8809305906C79BD075962079Dd8' }])
  })
})

describe('Validates Bitcoin addresses and filters duplicates', () => {
  it('Validates valid base58 Bitcoin addresses', () => {
    const validBase58Addresses = [
      { address: '1AnwDVbwsLBVwRfqN2x9Eo4YEJSPXo2cwG', network: 'bitcoin', chainId: 'mainnet' },
      { address: '385cR5DM96n1HvBDMzLHPYcw89fZAXULJP', network: 'bitcoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('1', 'bitcoin_json_rpc', validBase58Addresses)).toEqual(
      validBase58Addresses,
    )
  })

  it('Does not validate invalid base58 address', () => {
    const invalidBase58Addresses = [
      { address: '1AnwDVbwsLBVwRfqN2x9Eo4YEJSPXo2cw0', network: 'bitcoin', chainId: 'mainnet' },
      { address: '385cR5DM96n1HvBDMzLHPYcw89fZAXULJ0', network: 'bitcoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('1', 'bitcoin_json_rpc', invalidBase58Addresses)).toEqual([])
  })

  const validBech32Address = [
    {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      network: 'bitcoin',
      chainId: 'mainnet',
    },
  ]
  it('Validates valid bech32 Bitcoin addresses', () => {
    expect(validateAddresses('1', 'bitcoin_json_rpc', validBech32Address)).toEqual(
      validBech32Address,
    )
  })

  it('Validates valid bech32 Bitcoin address with upper case characters', () => {
    const validBech32AddressWithUppercase = [
      {
        address: 'bc1qar0SRRR7XFKVY5l643lydnw9RE59gtzzwf5mdq',
        network: 'bitcoin',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('1', 'bitcoin_json_rpc', validBech32AddressWithUppercase)).toEqual(
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
    expect(validateAddresses('1', 'eth_balance', invalidBech32Address)).toEqual([])
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
    expect(
      filterDuplicates('1', validateAddresses('1', 'bitcoin_json_rpc', duplicateBech32Address)),
    ).toEqual([
      {
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        network: 'bitcoin',
        chainId: 'mainnet',
      },
    ])
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
    expect(validateAddresses('1', 'cardano', validBase58Address)).toEqual(validBase58Address)
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
    expect(validateAddresses('1', 'cardano', invalidBase58Address)).toEqual([])
  })

  const validBech32Address = [
    {
      address: 'addr1vpu5vlrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w',
      network: 'cardano',
      chainId: 'mainnet',
    },
  ]
  it('Validates valid bech32 addresses', () => {
    expect(validateAddresses('1', 'cardano', validBech32Address)).toEqual(validBech32Address)
  })

  it('Validates valid bech32 address with upper case characters', () => {
    const validBech32AddressWithUppercase = [
      {
        address: 'ADDR1VPU5vlrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w',
        network: 'cardano',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('1', 'cardano', validBech32AddressWithUppercase)).toEqual(
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
    expect(validateAddresses('1', 'cardano', invalidBech32Address)).toEqual([])
  })

  it('Validates testnet addresses', () => {
    const validTestnetAddress = [
      {
        address:
          'addr_test1qz87tn9yat3xfutzds43tnj8qw457hk3v46w4028rtnx56v89wjwnrwcvlfm2atvcnnclh3x7thwrl7pgnffaw24mgws0dga4m',
        network: 'cardano',
        chainId: 'testnet',
      },
      {
        address:
          'addr_test1qqr585tvlc7ylnqvz8pyqwauzrdu0mxag3m7q56grgmgu7sxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknswgndm3',
        network: 'cardano',
        chainId: 'testnet',
      },
    ]
    expect(validateAddresses('1', 'ada_balance', validTestnetAddress)).toEqual(validTestnetAddress)
  })

  it('Does not validate invalid testnet addresses', () => {
    const invalidTestnetAddress = [
      {
        address: 'addr_test1vpu5Olrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w',
        network: 'cardano',
        chainId: 'testnet',
      },
    ]
    expect(validateAddresses('1', 'ada_balance', invalidTestnetAddress)).toEqual([])
  })
})

describe('Validates Dogecoin addresses', () => {
  it('Validates valid address', () => {
    const validAddress = [
      { address: 'DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD', network: 'dogecoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('1', 'dogecoin', validAddress)).toEqual(validAddress)
  })

  it('Does not validate invalid address', () => {
    const invalidAddresses = [
      { address: 'DBXu2kgc3OtvCUWFcxFE3r9hEYgmuaaCyD', network: 'dogecoin', chainId: 'mainnet' },
      { address: 'BBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD', network: 'dogecoin', chainId: 'mainnet' },
    ]
    expect(validateAddresses('1', 'dogecoin', invalidAddresses)).toEqual([])
  })
})

describe('Validates Filecoin addresses', () => {
  it('Validates valid address', () => {
    const validAddresses = [
      {
        address:
          'f0ws62urh2ezj5rfo6xsecccgbucyh4j23ygyrbuuwmmgatgci4wexm6l7cq6pp5geob7hfcsekxhys5mvqsvq',
        network: 'filecoin',
        chainId: 'mainnet',
      },
      {
        address: 'f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za',
        network: 'filecoin',
        chainId: 'mainnet',
      },
      {
        address:
          'f2ws62urh2ezj5rfo6xsecccgbucyh4j23ygyrbuuwmmgatgci4wexm6l7cq6pp5geob7hfcsekxhys5mvqsvq',
        network: 'filecoin',
        chainId: 'mainnet',
      },
      {
        address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi',
        network: 'filecoin',
        chainId: 'mainnet',
      },
      {
        address:
          'f3v2ua3tr344lbzpyl47blbb3hlmexk6hwuvsghbsaeoexm7qs5mpiovtv4s62om6lj67vk4n22cfdm2allvra',
        network: 'filecoin',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('1', 'filecoin', validAddresses)).toEqual(validAddresses)
  })

  it('Validates valid miner format address', () => {
    const minerAddress = [
      {
        address: 'f01850382',
        network: 'filecoin',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('1', 'filecoin', minerAddress)).toEqual(minerAddress)
  })

  it('Does not validate invalid address', () => {
    const invalidAddresses = [
      {
        address: '1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za',
        network: 'filecoin',
        chainId: 'mainnet',
      },
      {
        address:
          'f3ws62urh2ezj5rfo6xsecccgbucyh4j23ygyrbuuwmmgatgci4wexm6l7cq6pp5geob7hfcsekxhys5mvqsv1',
        network: 'filecoin',
        chainId: 'mainnet',
      },
    ]
    expect(validateAddresses('1', 'filecoin', invalidAddresses)).toEqual([])
  })
})

describe('Validates Beacon validator addresses', () => {
  it('Validates valid address', () => {
    const validAddresses = [
      {
        address:
          '0x89c1fa47be0aff073afe98720d9524534bd7cd6fdaf065e205cd290766c044eb0c39a5ed7977f7e7f3747ba550e0b0e4',
        network: 'mainnet',
        chainId: '1',
      },
      {
        address:
          '0x8000909f19cc28cd4335da3fe5dd3d84049259217d236a466885877cae255a3d30021aa25b50038ccf377b3e2e538284',
        network: 'mainnet',
        chainId: '1',
      },
      {
        address:
          '0x8000553d719a1b09006c80da3d6efb8227f5184512e89096e56f3b7ee6d29c45e44227415be00cfda05c0b3c85fe3048',
        network: 'mainnet',
        chainId: '1',
      },
    ]
    expect(validateAddresses('1', 'eth_beacon', validAddresses)).toEqual(validAddresses)
  })

  it('Does not validate invalid address', () => {
    const invalidAddresses = [
      {
        address:
          '0x89c1fa47be0aff073afe98720d9524534bd7cd6fdaf065e20544eb0c39a5ed7977f7e7f3747ba550e0b0e4',
        network: 'mainnet',
        chainId: '1',
      },
      {
        address: '1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za',
        network: 'mainnet',
        chainId: '1',
      },
    ]
    expect(validateAddresses('1', 'eth_beacon', invalidAddresses)).toEqual([])
  })
})

describe('Validates Avalanche addresses', () => {
  it('Validates valid address', () => {
    const validAddresses = [
      {
        address: 'P-avax1k9z2fnqu2nwvy23lf3ztgku6jdp22u6etv4ewc',
        network: 'avalanche',
        chainId: '43114',
      },
      {
        address: '0x74170Ba6590254c52d7786d3F590316c5BDE66a5',
        network: 'avalanche',
        chainId: '43114',
      },
      {
        address: 'X-avax1k9z2fnqu2nwvy23lf3ztgku6jdp22u6etv4ewc',
        network: 'avalanche',
        chainId: '43114',
      },
      {
        address: 'P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt',
        network: 'avalanche-fuji',
        chainId: '43113',
      },
    ]
    expect(validateAddresses('1', 'avalanche_platform', validAddresses)).toEqual(validAddresses)
  })

  it('Does not validate invalid address', () => {
    const invalidAddresses = [
      {
        address: 'P-avax1k9z2fn1u2nwvy23lf3ztgku6jdp22u6etv4ewc',
        network: 'avalanche',
        chainId: '43114',
      },
      {
        address: '0x74170Ba6590254c52d73422786d3F590316c5BDE66a5',
        network: 'avalanche',
        chainId: '43114',
      },
      {
        address: 'Xdsfsavax1k9z2fnqu2nwvy23lf3ztgku6jdp22u6etv4ewc',
        network: 'avalanche',
        chainId: '43114',
      },
    ]
    expect(validateAddresses('1', 'avalanche_platform', invalidAddresses)).toEqual([])
  })
})
