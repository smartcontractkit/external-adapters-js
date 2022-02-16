import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'

export const NAME = 'BSOL_PRICE'

export const DEFAULT_SOLIDO_ADDRESS = 'EMtjYGwPnXdtqK5SGL8CWGv4wgdBQN79UPoy53x9bBTJ'
export const DEFAULT_STSOL_ADDRESS = 'BSGfVnE6q6KemspkugEERU8x7WbQwSKwvHT1cZZ4ACVN'
export const DEFAULT_BSOL_ADDRESS = '3FMBoeddUhtqxepzkrxPrMUV3CL4bZM5QmMoLJfEpirz'
export const DEFAULT_SOLIDO_CONTRACT_VERSION = 0

export interface Config extends DefaultConfig {
  solidoAddress: string
  bSolAddress: string
  stSolAddress: string
  solidoContractVersion: number
}

export const makeConfig = (prefix?: string): Config => {
  const contractVersionEnvVar = util.getEnv('SOLIDO_CONTRACT_VERSION', prefix)
  return {
    ...Requester.getDefaultConfig(),
    defaultEndpoint: DEFAULT_ENDPOINT,
    solidoAddress: util.getEnv('SOLIDO_ADDRESS', prefix) || DEFAULT_SOLIDO_ADDRESS,
    bSolAddress: util.getEnv('BSOL_ADDRESS', prefix) || DEFAULT_BSOL_ADDRESS,
    stSolAddress: util.getEnv('STSOL_ADDRESS', prefix) || DEFAULT_STSOL_ADDRESS,
    solidoContractVersion: contractVersionEnvVar
      ? parseInt(contractVersionEnvVar)
      : DEFAULT_SOLIDO_CONTRACT_VERSION,
  }
}
