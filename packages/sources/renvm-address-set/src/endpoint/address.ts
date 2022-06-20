import {
  AdapterDataProviderError,
  AdapterError,
  AdapterInputError,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import { Account, Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
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
import { RenNetworkString } from '@renproject/interfaces'

export const supportedEndpoints = ['address']

export type TInputParameters = { network: string; chainId: string; tokenOrContract: string }
export const inputParameters: InputParameters<TInputParameters> = {
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
    throw new AdapterError({
      jobRunID,
      statusCode: 400,
      message: `Unsupported Ren network: ${config.network}.`,
    })
  }

  const chainId = data.chainId || DEFAULT_NETWORK
  if (!isRenNetwork(chainId)) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Unknown Ren network: ${data.network}`,
    })
  }

  let tokenOrContract = data.tokenOrContract || DEFAULT_TOKEN_OR_CONTRACT
  tokenOrContract = tokenOrContract.length === 3 ? tokenOrContract.toUpperCase() : tokenOrContract

  if (!isAsset(tokenOrContract) && !isRenContract(tokenOrContract)) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Unknown Ren tokenOrContract: ${tokenOrContract}`,
    })
  }

  const renContract = isAsset(tokenOrContract) ? resolveInToken(tokenOrContract) : tokenOrContract

  // Only BTC is supported for now
  if (renContract !== RenContract.Btc2Eth && renContract !== RenContract.Eth2Btc) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Unsupported token: ${tokenOrContract}`,
    })
  }

  const bitcoinNetwork = btc.getNetwork(chainId)
  if (!bitcoinNetwork) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Unknown Bitcoin network: ${chainId}`,
    })
  }

  const _getAddress = async (): Promise<string | undefined> => {
    if (!config.api) return undefined
    const { renVM } = new RenJS(chainId as RenNetworkString, {
      // use v1 legacy version
      useV2TransactionFormat: false,
    })
    // hard code asset since we only support BTC anyway in this adapter
    const out: Buffer = await renVM.selectPublicKey(renContract, 'BTC')
    return btc.p2pkh(out, bitcoinNetwork).address
  }

  let address
  try {
    address = await _getAddress()
  } catch (e) {
    throw new AdapterDataProviderError({ network: config.network, cause: e })
  }

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
