import { AdapterRequestBody } from '@chainlink/external-adapter-framework/util'
import BigNumber from 'bignumber.js'
import nock from 'nock'

export const addressData: AdapterRequestBody = {
  data: {
    chainId: 'goerli',
    addresses: [
      {
        address:
          '0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0',
        withdrawVaultAddress: '0x8c78BdB9CBB273ea295Cd8eEF198467d16c932cc',
        poolId: 1,
        operatorId: 1,
        status: 6,
      },
      {
        address:
          '0xaaea1a72970d9d8cd5fdee9c41437b24b9c49c34e35cd620c87fc8ad270ed822fe550690581422a90d7538e906f61d11',
        withdrawVaultAddress: '0xdfe70150Dc6f610e9c6d06Cc35f25c02E43EEEe9',
        poolId: 1,
        operatorId: 2,
        status: 6,
      },
      {
        address:
          '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10',
        withdrawVaultAddress: '0x9ab0017DC97FD6A8f907f5a60FC35DB36B581783',
        poolId: 2,
        operatorId: 1,
        status: 6,
      },
      {
        address:
          '0x839ca626eccd2edf45ce633e365715bf8610b85c9d24225ac5893d4861e385fb81529880358040bb4b86fea288db4dfc',
        withdrawVaultAddress: '0xDE5Db91B5F82f8b8c085fA9C5F290B00A0101D81',
        poolId: 3,
        operatorId: 3,
        status: 9,
      },
      {
        address:
          '0x84d290ec6a766cef753bcce7b6d75f12b405e5c76171f2a456ae415e872d23ea01f869e8f64629a48f0c21f0f86e37d3',
        withdrawVaultAddress: '0xF5E8A439C599205C1aB06b535DE46681Aed1007a',
        poolId: 4,
        operatorId: 2,
        status: 9,
      },
      {
        address:
          '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95',
        withdrawVaultAddress: '0x41E5d6bdF32d1ACB1aB0abeE083A211385591E62',
        poolId: 4,
        operatorId: 2,
        status: 9,
      },
      {
        address:
          '0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6',
        withdrawVaultAddress: '0x683913B3A32ada4F8100458A3E1675425BdAa7DF',
        poolId: 5,
        operatorId: 4,
        status: 3,
      },
      {
        address:
          '0x8af03fc3ba342b625c868325386fd421fa677d87cf96d528f4649cf043ea33b8f1466dd6bce66b0c9d949b8b65d1549c',
        withdrawVaultAddress: '0xc0C5368601404605fE948CA8A52AA332553C1865',
        poolId: 5,
        operatorId: 5,
        status: 4,
      },
    ],
    socialPoolAddresses: [
      { address: '0x10f4F0a7aadfB7E79533090508fADD78FB163068', poolId: 1 },
      { address: '0x9CfD5a30DB1B925A92E796e5Ce37Fd0E66390Fe1', poolId: 2 },
    ],
    elRewardAddresses: [
      { address: '0x8d86bc475bedcb08179c5e6a4d494ebd3b44ea8b' },
      { address: '0xfc07bcb5c142c7c86c84490f068d31499610ccab' },
    ],
    reportedBlock: 8000,
  },
}

export const mockPenaltyMap: Record<string, BigNumber> = {
  '0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0':
    BigNumber('1000000000000000000'), // 1 ETH
  '0xaaea1a72970d9d8cd5fdee9c41437b24b9c49c34e35cd620c87fc8ad270ed822fe550690581422a90d7538e906f61d11':
    BigNumber(0),
  '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10':
    BigNumber('500000000000000000'), // 0.5 ETH
  '0x839ca626eccd2edf45ce633e365715bf8610b85c9d24225ac5893d4861e385fb81529880358040bb4b86fea288db4dfc':
    BigNumber('750000000000000000'), // 0.75 ETH
  '0x84d290ec6a766cef753bcce7b6d75f12b405e5c76171f2a456ae415e872d23ea01f869e8f64629a48f0c21f0f86e37d3':
    BigNumber('100000000000000000'), // 0.1 ETH
  '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95':
    BigNumber('2000000000000000000'), // 2 ETH
  '0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6':
    BigNumber(0),
  '0x8af03fc3ba342b625c868325386fd421fa677d87cf96d528f4649cf043ea33b8f1466dd6bce66b0c9d949b8b65d1549c':
    BigNumber(0),
}

export const mockProtocolFeePercentMap: Record<number, number> = {
  1: 500,
  2: 750,
  3: 250,
  4: 500,
  5: 1000,
}

export const mockOperatorFeePercentMap: Record<number, number> = {
  1: 500,
  2: 750,
  3: 250,
  4: 500,
  5: 1000,
}

export const mockCollateralEthMap: Record<number, BigNumber> = {
  1: BigNumber('2000000000000000000'), // 2 ETH
  2: BigNumber('5500000000000000000'), // 5.5 ETH
  3: BigNumber('10000000000000000000'), // 10 ETH
  4: BigNumber('3000000000000000000'), // 3 ETH
  5: BigNumber('15000000000000000000'), // 15 ETH
}

export const mockEthBalanceMap: Record<string, string> = {
  '0x8c78BdB9CBB273ea295Cd8eEF198467d16c932cc': '0xDE0B6B3A7640000', // 1 ETH
  '0xdfe70150Dc6f610e9c6d06Cc35f25c02E43EEEe9': '0x1BC16D674EC80000', // 2 ETH
  '0x9ab0017DC97FD6A8f907f5a60FC35DB36B581783': '0x29A2241AF62C0000', // 3 ETH
  '0xDE5Db91B5F82f8b8c085fA9C5F290B00A0101D81': '0x1C9F78D2893E40000', // 33 ETH
  '0xF5E8A439C599205C1aB06b535DE46681Aed1007a': '0x1A055690D9DB80000', // 30 ETH
  '0x41E5d6bdF32d1ACB1aB0abeE083A211385591E62': '0x18493FBA64EF00000', // 29 ETH
  '0x974Db4Fb26993289CAD9f79Bde4eAE097503064f': '0x1BC16D674EC80000', // 2 ETH
  '0x8d86bc475bedcb08179c5e6a4d494ebd3b44ea8b': '0xDE0B6B3A7640000', // 1 ETH
  '0xfc07bcb5c142c7c86c84490f068d31499610ccab': '0x1BC16D674EC80000', // 2 ETH
  '0x10f4F0a7aadfB7E79533090508fADD78FB163068': '0x4563918244F40000', // 5 ETH
  '0x9CfD5a30DB1B925A92E796e5Ce37Fd0E66390Fe1': '0x68155A43676E0000', // 7.5 ETH
  '0xEc4166439523e8C2FaE395201f04876Cc7C02d68': '0x1AE361FC1451C0000', // 31 ETH
  '0xc0C5368601404605fE948CA8A52AA332553C1865': '0x0', // 0 ETH
}

export const mockGetValidatorStates = (): void => {
  nock('http://localhost:9092', { encodedQueryParams: true })
    .get(
      '/eth/v1/beacon/states/5708763/validators?' +
        'id=0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0,' +
        '0xaaea1a72970d9d8cd5fdee9c41437b24b9c49c34e35cd620c87fc8ad270ed822fe550690581422a90d7538e906f61d11,' +
        '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10,' +
        '0x839ca626eccd2edf45ce633e365715bf8610b85c9d24225ac5893d4861e385fb81529880358040bb4b86fea288db4dfc,' +
        '0x84d290ec6a766cef753bcce7b6d75f12b405e5c76171f2a456ae415e872d23ea01f869e8f64629a48f0c21f0f86e37d3,' +
        '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95,' +
        '0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6,' +
        '0x8af03fc3ba342b625c868325386fd421fa677d87cf96d528f4649cf043ea33b8f1466dd6bce66b0c9d949b8b65d1549c',
    )
    .reply(200, {
      execution_optimistic: true,
      data: [
        {
          index: '416512',
          balance: '33000000000',
          status: 'active_ongoing',
          validator: {
            pubkey:
              '0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0',
            withdrawal_credentials:
              '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
            effective_balance: '32000000000',
            slashed: false,
            activation_eligibility_epoch: '142627',
            activation_epoch: '142641',
            exit_epoch: '18446744073709551615',
            withdrawable_epoch: '18446744073709551615',
          },
        },
        {
          index: '416580',
          balance: '31000000000',
          status: 'active_ongoing',
          validator: {
            pubkey:
              '0xaaea1a72970d9d8cd5fdee9c41437b24b9c49c34e35cd620c87fc8ad270ed822fe550690581422a90d7538e906f61d11',
            withdrawal_credentials:
              '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
            effective_balance: '31000000000',
            slashed: false,
            activation_eligibility_epoch: '143203',
            activation_epoch: '143209',
            exit_epoch: '18446744073709551615',
            withdrawable_epoch: '18446744073709551615',
          },
        },
        {
          index: '416580',
          balance: '26000000000',
          status: 'active_ongoing',
          validator: {
            pubkey:
              '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10',
            withdrawal_credentials:
              '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
            effective_balance: '32000000000',
            slashed: false,
            activation_eligibility_epoch: '143203',
            activation_epoch: '143209',
            exit_epoch: '18446744073709551615',
            withdrawable_epoch: '18446744073709551615',
          },
        },
        {
          index: '416580',
          balance: '0',
          status: 'withdrawal_done',
          validator: {
            pubkey:
              '0x839ca626eccd2edf45ce633e365715bf8610b85c9d24225ac5893d4861e385fb81529880358040bb4b86fea288db4dfc',
            withdrawal_credentials:
              '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
            effective_balance: '32000000000',
            slashed: false,
            activation_eligibility_epoch: '143203',
            activation_epoch: '143209',
            exit_epoch: '18446744073709551615',
            withdrawable_epoch: '18446744073709551615',
          },
        },
        {
          index: '416580',
          balance: '0',
          status: 'withdrawal_done',
          validator: {
            pubkey:
              '0x84d290ec6a766cef753bcce7b6d75f12b405e5c76171f2a456ae415e872d23ea01f869e8f64629a48f0c21f0f86e37d3',
            withdrawal_credentials:
              '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
            effective_balance: '32000000000',
            slashed: false,
            activation_eligibility_epoch: '143203',
            activation_epoch: '143209',
            exit_epoch: '18446744073709551615',
            withdrawable_epoch: '18446744073709551615',
          },
        },
        {
          index: '416580',
          balance: '0',
          status: 'withdrawal_done',
          validator: {
            pubkey:
              '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95',
            withdrawal_credentials:
              '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
            effective_balance: '0',
            slashed: false,
            activation_eligibility_epoch: '143203',
            activation_epoch: '143209',
            exit_epoch: '18446744073709551615',
            withdrawable_epoch: '18446744073709551615',
          },
        },
        {
          index: '416580',
          balance: '1000000000',
          status: 'pending_initialized',
          validator: {
            pubkey:
              '0x8af03fc3ba342b625c868325386fd421fa677d87cf96d528f4649cf043ea33b8f1466dd6bce66b0c9d949b8b65d1549c',
            withdrawal_credentials:
              '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
            effective_balance: '1000000000',
            slashed: false,
            activation_eligibility_epoch: '143203',
            activation_epoch: '143209',
            exit_epoch: '18446744073709551615',
            withdrawable_epoch: '18446744073709551615',
          },
        },
      ],
    })
    .persist()
}

export const mockGetEthDepositContract = (): void => {
  nock('http://localhost:9092')
    .get('/eth/v1/config/deposit_contract')
    .reply(200, { data: { chain_id: '5', address: '0x8c5fecdc472e27bc447696f431e425d02dd46a8c' } })
    .persist()
}

export const mockGetGenesisBlockInfo = (): void => {
  nock('http://localhost:9092')
    .get('/eth/v1/beacon/genesis')
    .reply(200, {
      data: {
        genesis_time: '1590832934',
        genesis_validators_root:
          '0xcf8e0d4e9587369b2301d0790347320302cc0943d5a1884560367e8208d920f2',
        genesis_fork_version: '0x00000000',
      },
    })
    .persist()
}

export const mockFinalityCheckpoint = (): void => {
  nock('http://localhost:9092')
    .get('/eth/v1/beacon/states/finalized/finality_checkpoints')
    .reply(200, {
      execution_optimistic: false,
      data: {
        previous_justified: {
          epoch: '178400',
          root: '0x65a26398c6649107c272814a00b023e3d0678ab6783757b00e27fde34a222944',
        },
        current_justified: {
          epoch: '178401',
          root: '0xd4f262b241fcfe0e6d82eae70fd3216a742991d8af703358e139a1b1c3e2aa7f',
        },
        finalized: {
          epoch: '178400',
          root: '0x65a26398c6649107c272814a00b023e3d0678ab6783757b00e27fde34a222944',
        },
      },
    })
    .persist()
}
