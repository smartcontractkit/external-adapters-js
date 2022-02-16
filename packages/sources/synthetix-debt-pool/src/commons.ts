import { Validator, Requester, Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, InputParameters } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { SUPPORTED_CHAINS, Config } from './config'

const inputParameters: InputParameters = {
  chainSources: {
    required: false,
    description: `Array of chains to pull debt from. Options for array elements are "mainnet" | "goerli" | "mainnet-ovm" | "kovan" | "kovan-ovm" | "mainnet-fork"`,
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
    chainSources = Object.values(SUPPORTED_CHAINS)
  }

  const debt = await getDebtData(jobRunID, config, chainSources)
  const result = {
    data: {
      result: debt.toString(),
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}
