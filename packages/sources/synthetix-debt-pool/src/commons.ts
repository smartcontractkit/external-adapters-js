import { Validator, Requester, Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, InputParameters } from '@chainlink/types'
import { BigNumber, ethers } from 'ethers'
import { SupportedChains, Config } from './config'
import { AdapterError } from '@chainlink/ea-bootstrap'
import { SynthetixJS, synthetix } from '@synthetixio/contracts-interface'

export const inputParameters: InputParameters = {
  chainSources: {
    required: false,
    description: `Array of chains to pull debt from. Options for array elements are "mainnet", "mainnet-ovm", "kovan", "kovan-ovm"`,
    type: 'array',
  },
}

type GetDebtData = (jobRunID: string, config: Config, chainsToQuery: string[]) => Promise<BigNumber>

export const getDataFromAcrossChains = async (
  request: AdapterRequest,
  config: Config,
  getDebtData: GetDebtData,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  let { chainSources } = validator.validated.data

  if (!chainSources) {
    Logger.info('chainSources is undefined.  Will aggregate debt over all supported chains')
    chainSources = [SupportedChains.ETHEREUM, SupportedChains.OPTIMISM]
  }
  validateChainSources(jobRunID, chainSources)
  const debt = await getDebtData(jobRunID, config, chainSources)
  const result = {
    data: {
      result: debt.toString(),
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}

const validateChainSources = (jobRunID: string, chainSources: string[]) => {
  const supportedChains = Object.values(SupportedChains) as string[]
  for (const source of chainSources) {
    if (!supportedChains.includes(source)) {
      throw new AdapterError({
        jobRunID,
        message: `${source} is not a supported chain.  Must be one of ${supportedChains.join(',')}`,
      })
    }
  }
}

export const getChainSynthetixInstance = (
  network: string,
  jobRunID: string,
  config: Config,
): SynthetixJS => {
  const { rpcURL, networkId } = config.chains[network]
  if (!rpcURL) {
    throw new AdapterError({
      jobRunID,
      message: `RPC URL not set for chain: ${network}`,
    })
  }
  const provider = new ethers.providers.JsonRpcProvider(rpcURL)
  return synthetix({ provider, networkId })
}
