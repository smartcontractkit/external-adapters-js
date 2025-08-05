import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { customSubscriptionTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      description: 'Map names to token or position manager contract addresses',
      array: true,
      type: {
        name: {
          required: true,
          type: 'string',
          description: 'Name of the address to use in balanceOf and getTotalLPT queries',
        },
        address: {
          required: true,
          type: 'string',
          description: 'Address of token or position manager contract referred to by name',
        },
      },
    },
    balanceOf: {
      required: true,
      type: {
        tokenContract: {
          required: true,
          type: 'string',
          description: 'Name of address of token contract to query balanceOf',
        },
        account: {
          required: true,
          type: 'string',
          description: 'Name of address to query balanceOf for',
        },
      },
      array: true,
      description: 'Balances to query to sum',
    },
    getTotalLPT: {
      required: true,
      type: 'string',
      array: true,
      description: 'Names of addresses to sum getTotalLPT results for',
    },
  },
  [
    {
      addresses: [
        { name: 'cmETH', address: '0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA' },
        { name: 'mETH', address: '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa' },
        { name: 'BoringVault', address: '0x33272D40b247c4cd9C646582C9bbAD44e85D4fE4' },
        { name: 'PositionManager-Karak', address: '0x52EA8E95378d01B0aaD3B034Ca0656b0F0cc21A2' },
        {
          name: 'V1:PositionManager-Symbiotic',
          address: '0x919531146f9a25dfc161d5ab23b117feae2c1d36',
        },
        {
          name: 'V1:SymbioticRestakingPool',
          address: '0x475d3eb031d250070b63fa145f0fcfc5d97c304a',
        },
      ],
      balanceOf: [
        {
          tokenContract: 'mETH',
          account: 'BoringVault',
        },
        {
          tokenContract: 'mETH',
          account: 'PositionManager-Karak',
        },
        {
          tokenContract: 'V1:SymbioticRestakingPool',
          account: 'V1:PositionManager-Symbiotic',
        },
      ],
      getTotalLPT: ['PositionManager-Karak'],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      balances: {
        [tokenContract: string]: {
          [address: string]: string
        }
      }
      totalLpts: {
        [contractName: string]: string
      }
      totalReserve: string
      totalSupply: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: customSubscriptionTransport,
  inputParameters,
})
