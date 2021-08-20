import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import RenJS from '@renproject/ren'
import { btc } from './coins'
import { DEFAULT_NETWORK, DEFAULT_TOKEN_OR_CONTRACT, makeConfig } from './config'
import {
  getTokenName,
  isAsset,
  isRenContract,
  isRenNetwork,
  RenContract,
  resolveInToken,
} from './ren'
const inputParams = {
  network: false,
  tokenOrContract: false,
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const { data } = validator.validated

  if (config.network && config.network !== data.network) {
    throw Error(`Unsupported Ren network: ${config.network}.`)
  }

  const network = data.network || DEFAULT_NETWORK
  if (!isRenNetwork(network)) {
    throw Error(`Unknown Ren network: ${data.network}`)
  }

  let tokenOrContract = data.tokenOrContract || DEFAULT_TOKEN_OR_CONTRACT
  tokenOrContract = tokenOrContract.length === 3 ? tokenOrContract.toUpperCase() : tokenOrContract

  if (!isAsset(tokenOrContract) && !isRenContract(tokenOrContract)) {
    throw Error(`Unknown Ren tokenOrContract: ${tokenOrContract}`)
  }

  const renContract = isAsset(tokenOrContract) ? resolveInToken(tokenOrContract) : tokenOrContract

  // Only BTC is supported for now
  if (renContract !== RenContract.Btc2Eth && renContract !== RenContract.Eth2Btc) {
    throw Error(`Unsupported token: ${tokenOrContract}`)
  }

  const bitcoinNetwork = btc.getNetwork(network)
  if (!bitcoinNetwork) {
    throw Error(`Unknown Bitcoin network: ${network}`)
  }

  const _getAddress = async (): Promise<string | undefined> => {
    if (!config.api) return undefined
    const { renVM } = new RenJS(network, {
      // use v1 legacy version
      useV2TransactionFormat: false,
    })
    // hard code asset since we only support BTC anyway in this adapter
    const out: Buffer = await renVM.selectPublicKey(renContract, 'BTC')
    return btc.p2pkh(out, bitcoinNetwork).address
  }

  const address = await _getAddress()
  const result = [
    {
      address,
      coin: getTokenName(renContract).toLowerCase(),
      chain: network,
    },
  ]

  return Requester.success(
    jobRunID,
    {
      data: { result },
      status: 200,
    },
    config.verbose,
  )
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
