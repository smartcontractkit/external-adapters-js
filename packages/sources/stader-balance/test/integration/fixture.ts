import { AdapterRequestBody } from '@chainlink/external-adapter-framework/util'
import nock from 'nock'

export const addressData: AdapterRequestBody = {
  data: {
    addresses: [
      {
        address:
          '0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0',
        initialBondEth: 1000000000,
        withdrawVaultAddress: '0x8c78BdB9CBB273ea295Cd8eEF198467d16c932cc',
        poolId: 1,
        operatorId: 1,
      },
      {
        address:
          '0xaaea1a72970d9d8cd5fdee9c41437b24b9c49c34e35cd620c87fc8ad270ed822fe550690581422a90d7538e906f61d11',
        initialBondEth: 2000000000,
        withdrawVaultAddress: '0xdfe70150Dc6f610e9c6d06Cc35f25c02E43EEEe9',
        poolId: 1,
        operatorId: 2,
      },
      {
        address:
          '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10',
        initialBondEth: 5500000000,
        withdrawVaultAddress: '0x9ab0017DC97FD6A8f907f5a60FC35DB36B581783',
        poolId: 2,
        operatorId: 1,
      },
      {
        address:
          '0x839ca626eccd2edf45ce633e365715bf8610b85c9d24225ac5893d4861e385fb81529880358040bb4b86fea288db4dfc',
        initialBondEth: 10000000000,
        withdrawVaultAddress: '0xDE5Db91B5F82f8b8c085fA9C5F290B00A0101D81',
        poolId: 3,
        operatorId: 3,
      },
      {
        address:
          '0x84d290ec6a766cef753bcce7b6d75f12b405e5c76171f2a456ae415e872d23ea01f869e8f64629a48f0c21f0f86e37d3',
        initialBondEth: 3000000000,
        withdrawVaultAddress: '0xF5E8A439C599205C1aB06b535DE46681Aed1007a',
        poolId: 4,
        operatorId: 2,
      },
      {
        address:
          '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95',
        initialBondEth: 1000000000,
        withdrawVaultAddress: '0x41E5d6bdF32d1ACB1aB0abeE083A211385591E62',
        poolId: 4,
        operatorId: 2,
      },
      {
        address:
          '0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c',
        initialBondEth: 32000000000,
        withdrawVaultAddress: '0x683913B3A32ada4F8100458A3E1675425BdAa7DF',
        poolId: 5,
        operatorId: 4,
      },
    ],
    socializingPoolAddresses: [
      '0x10f4F0a7aadfB7E79533090508fADD78FB163068',
      '0x9CfD5a30DB1B925A92E796e5Ce37Fd0E66390Fe1',
    ],
    elRewardAddresses: [
      '0x8d86bc475bedcb08179c5e6a4d494ebd3b44ea8b',
      '0xfc07bcb5c142c7c86c84490f068d31499610ccab',
    ],
    stakeManagerAddress: '0xAA2a874c1fe5530fa87e98860b6b578BDb9D441D',
  },
}

export const mockPenaltyMap: Record<string, number> = {
  '0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0': 1_000_000_000,
  '0xaaea1a72970d9d8cd5fdee9c41437b24b9c49c34e35cd620c87fc8ad270ed822fe550690581422a90d7538e906f61d11': 0,
  '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10': 500_000_000,
  '0x839ca626eccd2edf45ce633e365715bf8610b85c9d24225ac5893d4861e385fb81529880358040bb4b86fea288db4dfc': 750_000_000,
  '0x84d290ec6a766cef753bcce7b6d75f12b405e5c76171f2a456ae415e872d23ea01f869e8f64629a48f0c21f0f86e37d3': 100_000_000,
  '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95': 2_000_000_000,
  '0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c': 0,
}

export const mockProtocolFeePercentMap: Record<string, number> = {
  1: 0.05,
  2: 0.075,
  3: 0.025,
  4: 0.05,
  5: 0.1,
}

export const mockOperatorFeePercentMap: Record<string, number> = {
  1: 0.05,
  2: 0.075,
  3: 0.025,
  4: 0.05,
  5: 0.1,
}

export const mockEthers = (): void => {
  jest.mock('ethers', () => {
    const actualModule = jest.requireActual('ethers')
    return {
      ...actualModule,
      ethers: {
        ...actualModule.ethers,
        providers: {
          JsonRpcProvider: function () {
            return {
              getBlockNumber: jest.fn().mockReturnValue(1000),
            }
          },
        },
        Contract: function () {
          return {
            getProtocolFeePercent: jest
              .fn()
              .mockImplementation((poolId: number) => mockProtocolFeePercentMap[poolId]),
            getOperatorFeePercent: jest
              .fn()
              .mockImplementation((poolId: number) => mockOperatorFeePercentMap[poolId]),
            calculatePenalty: jest
              .fn()
              .mockImplementation((address: string) => mockPenaltyMap[address]),
          }
        },
      },
    }
  })
}

export const mockGetValidatorStates = (): void => {
  nock('http://localhost:9092', { encodedQueryParams: true })
    .get(
      '/eth/v1/beacon/states/finalized/validators?' +
        'id=0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0,' +
        '0xaaea1a72970d9d8cd5fdee9c41437b24b9c49c34e35cd620c87fc8ad270ed822fe550690581422a90d7538e906f61d11,' +
        '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10,' +
        '0x839ca626eccd2edf45ce633e365715bf8610b85c9d24225ac5893d4861e385fb81529880358040bb4b86fea288db4dfc,' +
        '0x84d290ec6a766cef753bcce7b6d75f12b405e5c76171f2a456ae415e872d23ea01f869e8f64629a48f0c21f0f86e37d3,' +
        '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95,' +
        '0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c',
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
          balance: '32067790944',
          status: 'exited_unslashed',
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
          balance: '32067790944',
          status: 'exited_unslashed',
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
          balance: '32067790944',
          status: 'exited_slashed',
          validator: {
            pubkey:
              '0x933ad9491b62059dd065b560d256d8957a8c402cc6e8d8ee7290ae11e8f7329267a8811c397529dac52ae1342ba58c95',
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
      ],
    })
}

export const mockGetEthBalances = (): void => {
  nock('http://localhost:9091', { encodedQueryParams: true })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0x8c78BdB9CBB273ea295Cd8eEF198467d16c932cc', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x3B9ACA00', // 1_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0xdfe70150Dc6f610e9c6d06Cc35f25c02E43EEEe9', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x77359400', // 2_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0x9ab0017DC97FD6A8f907f5a60FC35DB36B581783', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0xB2D05E00', /// 3_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0xDE5Db91B5F82f8b8c085fA9C5F290B00A0101D81', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x7AEF40A00', // 33_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0xF5E8A439C599205C1aB06b535DE46681Aed1007a', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x6FC23AC00', // 30_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0x41E5d6bdF32d1ACB1aB0abeE083A211385591E62', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x6C088E200', // 29_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0xAA2a874c1fe5530fa87e98860b6b578BDb9D441D', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x77359400', // 2_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0x8d86bc475bedcb08179c5e6a4d494ebd3b44ea8b', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x3B9ACA00', // 1_000_000_000
    })
    .post('/', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: ['0xfc07bcb5c142c7c86c84490f068d31499610ccab', 'latest'],
      id: 0,
    })
    .reply(200, {
      jsonrpc: '2.0',
      id: 0,
      result: '0x77359400', // 2_000_000_000
    })
}
