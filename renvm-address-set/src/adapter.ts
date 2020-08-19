import RenJS from '@renproject/ren'
import {
  RenContract,
  isRenNetwork,
  isRenContract,
  isAsset,
  LockAndMintParams,
} from '@renproject/interfaces'
import { resolveInToken, getTokenName } from '@renproject/utils'
import { Requester, Validator } from '@chainlink/external-adapter'
import {
  Config,
  getConfig,
  logConfig,
  DEFAULT_NETWORK,
  DEFAULT_TOKEN_OR_CONTRACT,
} from './config'
import { btc } from './coins'

type JobSpecRequest = { id: string; data: Record<string, unknown> }
type Callback = (statusCode: number, data: Record<string, unknown>) => void

const inputParams = {
  network: false,
  tokenOrContract: false,
}

const config: Config = getConfig()
logConfig(config)

// Export function to integrate with Chainlink node
export const execute = (request: JobSpecRequest, callback: Callback): void => {
  const validator = new Validator(callback, request, inputParams)
  const jobRunID = validator.validated.id

  const _handleError = (err: Error): void =>
    callback(500, Requester.errored(jobRunID, err.message))

  const { data } = validator.validated

  if (config.network && config.network !== data.network) {
    _handleError(Error(`Unsupported Ren network: ${config.network}.`))
    return
  }

  const network = data.network || DEFAULT_NETWORK
  if (!isRenNetwork(network)) {
    _handleError(Error(`Unknown Ren network: ${data.network}`))
    return
  }

  let tokenOrContract = data.tokenOrContract || DEFAULT_TOKEN_OR_CONTRACT
  tokenOrContract =
    tokenOrContract.length === 3
      ? tokenOrContract.toUpperCase()
      : tokenOrContract

  if (!isAsset(tokenOrContract) && !isRenContract(tokenOrContract)) {
    _handleError(Error(`Unknown Ren tokenOrContract: ${tokenOrContract}`))
    return
  }

  const renContract = isAsset(tokenOrContract)
    ? resolveInToken(tokenOrContract as LockAndMintParams['sendToken'])
    : tokenOrContract

  // Only BTC is supported for now
  if (
    renContract !== RenContract.Btc2Eth &&
    renContract !== RenContract.Eth2Btc
  ) {
    _handleError(Error(`Unsupported token: ${tokenOrContract}`))
    return
  }

  const bitcoinNetwork = btc.getNetwork(network)
  if (!bitcoinNetwork) {
    _handleError(Error(`Unknown Bitcoin network: ${network}`))
    return
  }

  const _getAddress = async (): Promise<string | undefined> => {
    const { renVM } = new RenJS(network, config.api.baseURL)
    const out: Buffer = await renVM.selectPublicKey(renContract)
    return btc.p2pkh(out, bitcoinNetwork).address
  }

  const _handleResponse = (address: string | undefined): void => {
    const result = [
      {
        address,
        coin: getTokenName(renContract).toLowerCase(),
        chain: network,
      },
    ]
    callback(
      200,
      Requester.success(jobRunID, {
        data: { result },
        result,
        status: 200,
      })
    )
  }

  _getAddress().then(_handleResponse).catch(_handleError)
}
