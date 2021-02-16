import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { default as hardhatConfig } from '../../hardhat.config'

export type Config = {
  rpcUrl: string
  network: string
  privateKey: string
  api: any
}

export const DEFAULT_ENDPOINT = 'txsend'

export const makeConfig = (): Config => {
  return {
    api: {},
    rpcUrl: util.getEnv('RPC_URL') || 'http://localhost:4444',
    network: util.getEnv('NETWORK') || 'mainnet',
    privateKey: util.getEnv('PRIVATE_KEY') || hardhatConfig.networks.hardhat.accounts[0].privateKey,
  }
}
