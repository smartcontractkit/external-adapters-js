import {
  Logger,
  Requester,
  Validator,
  AdapterDataProviderError,
  util,
} from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ExtendedConfig, Networks } from '../config'
import {
  checkSequencerHealth,
  NetworkHealthCheck,
  getStatusByTransaction,
  checkNetworkProgress,
} from '../network'

export const supportedEndpoints = ['health']

const defaultRequireTxFailure = {
  [Networks.Arbitrum]: false,
  [Networks.Base]: false,
  [Networks.Linea]: false,
  [Networks.Metis]: false,
  [Networks.Optimism]: false,
  [Networks.Scroll]: false,
  [Networks.Starkware]: true,
  [Networks.zkSync]: false,
}

export type TInputParameters = {
  network: string
  requireTxFailure?: boolean
}
export const inputParameters: InputParameters<TInputParameters> = {
  network: {
    required: true,
    options: [
      Networks.Arbitrum,
      Networks.Base,
      Networks.Linea,
      Networks.Metis,
      Networks.Optimism,
      Networks.Scroll,
      Networks.Starkware,
      Networks.zkSync,
    ],
  },
  requireTxFailure: {
    required: false,
    description:
      'Require the EA to attempt a tx as final proof whether the chain is healthy. This is `false` by default except when `network`=`starkware`',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const network = validator.validated.data.network as Networks
  const requireTxFailure =
    typeof validator.validated.data.requireTxFailure === 'boolean'
      ? validator.validated.data.requireTxFailure
      : defaultRequireTxFailure[network]

  const _translateIntoFeedResponse = (isHealthy: boolean): number => {
    return isHealthy ? 0 : 1
  }

  const _respond = (isHealthy: boolean) => {
    const result = _translateIntoFeedResponse(isHealthy)
    return Requester.success(
      jobRunID,
      {
        data: {
          isHealthy: result === 0,
          result,
        },
      },
      config.verbose,
    )
  }

  const _tryMethod = async (
    fn: NetworkHealthCheck,
    network: Networks,
    config: ExtendedConfig,
  ): Promise<boolean> => {
    try {
      const isHealthy = await fn(network, config)
      if (isHealthy === false) {
        Logger.warn(
          `[${network}] Method ${fn.name} reported an unhealthy response. Network ${network} considered unhealthy`,
        )
        return false
      }
    } catch (e: any) {
      const error = e as Error
      Logger.error(
        `[${network}] Method ${fn.name} failed: ${error.message}. Network ${network} considered unhealthy`,
      )
      return false
    }
    return true
  }

  // #1 Option: Direct check on health endpoint
  // #2 Option: Check block height
  // If every method succeeds, the Network is considered healthy
  // If any method fails, the EA sends an empty transaction to the network.  The
  // Sequencer is considered to be healthy if the networks returns an expected
  // error and does not timeout.
  const methods = [checkSequencerHealth, checkNetworkProgress]
  for (const method of methods) {
    const isHealthy = await _tryMethod(method, network, config)
    if (!isHealthy) {
      if (requireTxFailure) {
        Logger.info(
          `[${network}] Checking unhealthy network ${network} with transaction submission`,
        )
        let isHealthyByTransaction
        try {
          isHealthyByTransaction = await getStatusByTransaction(network, config)
        } catch (e: any) {
          throw new AdapterDataProviderError({
            network,
            message: util.mapRPCErrorMessage(e?.code, e?.message),
            cause: e,
          })
        }
        if (isHealthyByTransaction) {
          Logger.info(
            `[${network}] Transaction submission check succeeded. Network ${network} can be considered healthy`,
          )
          return _respond(true)
        }
      }
      return _respond(false)
    }
  }

  // Every method succeded. Network is healthy
  return _respond(true)
}
