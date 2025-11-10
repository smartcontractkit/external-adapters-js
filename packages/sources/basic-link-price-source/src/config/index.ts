import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL_ETHEREUM: {
    type: 'string',
    description: 'Ethereum RPC URL',
    default: 'https://ethereum-rpc.publicnode.com',
  },
  RPC_URL_ARBITRUM: {
    type: 'string',
    description: 'Arbitrum RPC URL',
    default: 'https://arbitrum-one-rpc.publicnode.com',
  },
})
