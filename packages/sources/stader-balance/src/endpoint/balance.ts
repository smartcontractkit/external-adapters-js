import {
  PoRBalanceEndpoint,
  PoRBalanceResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/balance'
import { StaderValidatorStatus, networks, chainIds } from '../transport/utils'

export const inputParameters = new InputParameters(
  {
    addresses: {
      aliases: ['result'],
      required: true,
      description:
        'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
      array: true,
      type: {
        address: {
          type: 'string',
          required: true,
          description: 'an address to get the balance of',
        },
        poolId: {
          type: 'number',
          required: true,
          description: 'The ID of the validator pool',
        },
        status: {
          type: 'number',
          description: 'Stader status ID for this particular validator',
          required: true,
          options: Object.values(StaderValidatorStatus).filter(
            (value) => typeof value === 'number',
          ) as number[],
        },
        withdrawVaultAddress: {
          type: 'string',
          description: 'Validator withdrawal address for this particular validator',
          required: true,
        },
        operatorId: {
          type: 'number',
          description: 'The Stader assigned operator ID for this particular validator',
          required: true,
        },
      },
    },
    elRewardAddresses: {
      description: 'List of unique execution layer reward addresses',
      type: {
        address: {
          type: 'string',
          required: true,
          description: 'One of the execution layer reward addresses',
        },
      },
      required: true,
      array: true,
    },
    socialPoolAddresses: {
      description: 'List of socializing pool addresses',
      type: {
        address: {
          type: 'string',
          required: true,
          description: 'One of the social pool addresses',
        },
        poolId: {
          type: 'number',
          required: true,
          description: 'The ID of the social pool',
        },
      },
      required: true,
      array: true,
    },
    reportedBlock: {
      type: 'number',
      description: 'The reported block number retrieved from Stader',
      required: true,
    },
    stateId: {
      type: 'string',
      description: 'The beacon chain state ID to query',
      default: 'finalized',
    },
    validatorStatus: {
      required: false,
      type: 'string',
      description: 'A filter to apply validators by their status',
      array: true,
    },
    penaltyAddress: {
      description: 'The address of the Stader Penalty contract.',
      type: 'string',
    },
    poolFactoryAddress: {
      description: 'The address of the Stader PoolFactory contract.',
      type: 'string',
    },
    stakeManagerAddress: {
      description: 'The adddress of the Stader StakeManager contract',
      type: 'string',
    },
    permissionedPoolAddress: {
      description: 'The adddress of the Stader Permissioned Pool',
      type: 'string',
    },
    staderConfigAddress: {
      description: 'The address of the Stader Config contract.',
      type: 'string',
    },
    network: {
      description: 'The name of the target custodial network protocol',
      options: networks,
      type: 'string',
      default: 'ethereum',
    },
    chainId: {
      description: 'The name of the target custodial chain',
      options: chainIds,
      type: 'string',
      default: 'mainnet',
    },
    confirmations: {
      type: 'number',
      description: 'The number of confirmations to query data from',
      default: 0,
    },
  },
  [
    {
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
            '0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10',
          withdrawVaultAddress: '0x9ab0017DC97FD6A8f907f5a60FC35DB36B581783',
          poolId: 2,
          operatorId: 1,
          status: 6,
        },
      ],
      chainId: 'goerli',
      confirmations: 0,
      elRewardAddresses: [
        { address: '0x8d86bc475bedcb08179c5e6a4d494ebd3b44ea8b' },
        { address: '0xfc07bcb5c142c7c86c84490f068d31499610ccab' },
      ],
      network: 'ethereum',
      reportedBlock: 8000,
      socialPoolAddresses: [
        { address: '0x10f4F0a7aadfB7E79533090508fADD78FB163068', poolId: 1 },
        { address: '0x9CfD5a30DB1B925A92E796e5Ce37Fd0E66390Fe1', poolId: 2 },
      ],
      stateId: 'finalized',
      validatorStatus: [],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: PoRBalanceResponse
}

export const balanceEndpoint = new PoRBalanceEndpoint({
  name: 'balance',
  transport,
  inputParameters,
})
