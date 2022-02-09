import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'

export interface Config extends DefaultConfig {
  solidoAddress: string
  bSolAddress: string
  stSolAddress: string
  solidoContractVersion: number
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(),
    defaultEndpoint: DEFAULT_ENDPOINT,
    solidoAddress: util.getRequiredEnv('SOLIDO_ADDRESS', prefix),
    bSolAddress: util.getRequiredEnv('BSOL_ADDRESS', prefix),
    stSolAddress: util.getRequiredEnv('STSOL_ADDRESS', prefix),
    solidoContractVersion: parseInt(util.getRequiredEnv('SOLIDO_CONTRACT_VERSION', prefix)),
  }
}
