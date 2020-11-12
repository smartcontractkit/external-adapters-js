import objectPath from 'object-path'
import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, DEFAULT_DATA_PATH, getBaseURL } from '../config'
import { CoinType, ChainType } from '.'

export const Name = 'balance'

// Export function to integrate with Chainlink node
export const execute = async (config: Config, request: AdapterRequest) => {
  return {}
}
