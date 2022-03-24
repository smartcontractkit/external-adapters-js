import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Account, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import RenJS from '@renproject/ren'
import { btc } from '../coins'
import { DEFAULT_NETWORK, DEFAULT_TOKEN_OR_CONTRACT } from '../config'
import {
  getTokenName,
  getTokenNetwork,
  isAsset,
  isRenContract,
  isRenNetwork,
  RenContract,
  resolveInToken,
} from '../ren'
import { PorInputAddress } from '@chainlink/proof-of-reserves-adapter/src/utils/PorInputAddress'

export const supportedEndpoints = ['address']

export const inputParameters: InputParameters = {
  network: {
    required: false,
    description:
      'specify what RenVM network you are talking to. Options: `mainnet`, `chaosnet`, `testnet`',
    default: 'testnet',
  },
  chainId: {
    required: false,
  },
  tokenOrContract: {
    required: false,
    description: 'token or contract to return an address for',
  },
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const { data } = validator.validated

  if (config.network && config.network !== data.network) {
    throw Error(`Unsupported Ren network: ${config.network}.`)
  }

  const chainId = data.chainId || DEFAULT_NETWORK
  if (!isRenNetwork(chainId)) {
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

  const bitcoinNetwork = btc.getNetwork(chainId)
  if (!bitcoinNetwork) {
    throw Error(`Unknown Bitcoin network: ${chainId}`)
  }

  const _getAddress = async (): Promise<string | undefined> => {
    if (!config.api) return undefined
    const { renVM } = new RenJS(chainId, {
      // use v1 legacy version
      useV2TransactionFormat: false,
    })
    // hard code asset since we only support BTC anyway in this adapter
    const out: Buffer = await renVM.selectPublicKey(renContract, 'BTC')
    return btc.p2pkh(out, bitcoinNetwork).address
  }

  const address = await _getAddress()
  if (!address) {
    throw Error(`Address must be non-empty`)
  }
  const coin = getTokenName(renContract)
  const result: Array<Account & PorInputAddress> = [
    {
      address,
      coin: coin.toLowerCase(),
      network: getTokenNetwork(coin),
      chainId,
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
