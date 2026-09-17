import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import {
  cardano,
  etherFi,
  evm,
  litecoin,
  solana,
  solanaBalance,
  solanaMulti,
  stellar,
  tbill,
  xrp,
  xrpl,
} from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: evm.name,
  name: 'TOKEN_BALANCE',
  config,
  endpoints: [
    evm,
    etherFi,
    tbill,
    xrp,
    xrpl,
    cardano,
    solana,
    solanaMulti,
    solanaBalance,
    stellar,
    litecoin,
  ],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
