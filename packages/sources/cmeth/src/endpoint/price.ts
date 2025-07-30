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
        {
          name: 'KmETH',
          address: '0x7c22725d1e0871f0043397c9761ad99a86ffd498',
        },
        { name: 'BoringVault', address: '0x33272D40b247c4cd9C646582C9bbAD44e85D4fE4' },
        { name: 'DelayedWithdraw', address: '0x12Be34bE067Ebd201f6eAf78a861D90b2a66B113' },
        { name: 'PositionManager-Karak', address: '0x52EA8E95378d01B0aaD3B034Ca0656b0F0cc21A2' },
        {
          name: 'V1:PositionManager-Symbiotic',
          address: '0x919531146f9a25dfc161d5ab23b117feae2c1d36',
        },
        {
          name: 'V1:PositionManager-Eigen_A41',
          address: '0x6DfbE3A1a0e835C125EEBb7712Fffc36c4D93b25',
        },
        {
          name: 'V1:PositionManager-Eigen_P2P',
          address: '0x021180A06Aa65A7B5fF891b5C146FbDaFC06e2DA',
        },
        {
          name: 'V1:SymbioticRestakingPool',
          address: '0x475d3eb031d250070b63fa145f0fcfc5d97c304a',
        },
        {
          name: 'V2:PositionManager-Symbiotic',
          address: '0x5bb8e5e8602b71b182e0Efe256896a931489A135',
        },
        {
          name: 'V2:PositionManager-Eigen_A41',
          address: '0xCaC15044a1F67238D761Aa4C7650DaB59cEF849D',
        },
        {
          name: 'V2:PositionManager-Eigen_P2P',
          address: '0x0b5d15445b715bf117ba0482b7a9f772af46d93a',
        },
      ],
      balanceOf: [
        {
          tokenContract: 'cmETH',
          account: 'BoringVault',
        },
        {
          tokenContract: 'cmETH',
          account: 'PositionManager-Karak',
        },
        {
          tokenContract: 'cmETH',
          account: 'V1:PositionManager-Symbiotic',
        },
        {
          tokenContract: 'cmETH',
          account: 'V1:PositionManager-Eigen_A41',
        },
        {
          tokenContract: 'cmETH',
          account: 'V1:PositionManager-Eigen_P2P',
        },
        {
          tokenContract: 'cmETH',
          account: 'V2:PositionManager-Symbiotic',
        },
        {
          tokenContract: 'cmETH',
          account: 'V2:PositionManager-Eigen_A41',
        },
        {
          tokenContract: 'cmETH',
          account: 'V2:PositionManager-Eigen_P2P',
        },
        {
          tokenContract: 'V1:SymbioticRestakingPool',
          account: 'V1:PositionManager-Symbiotic',
        },
        {
          tokenContract: 'cmETH',
          account: 'DelayedWithdraw',
        },
      ],
      getTotalLPT: [
        'PositionManager-Karak',
        'V1:PositionManager-Eigen_A41',
        'V1:PositionManager-Eigen_P2P',
        'V2:PositionManager-Symbiotic',
        'V2:PositionManager-Eigen_A41',
        'V2:PositionManager-Eigen_P2P',
      ],
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
