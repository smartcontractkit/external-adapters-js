import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { BigNumber, FixedNumber, ethers } from 'ethers'
import EACAggregatorProxyAbi from '../abis/EACAggregatorProxy.json'
import { LatestRoundResponse } from '../types'
import { Config } from '../config'

export const supportedEndpoints = ['btc-dominance', 'dominance']
export const description = 'Endpoint to calculate BTC dominance'

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

const getMarketCapValue = async (address: string, config: Config): Promise<BigNumber> => {
  const contract = new ethers.Contract(address, EACAggregatorProxyAbi, config.provider)
  const data: LatestRoundResponse = await contract.latestRoundData()
  return data.answer
}

const calculateBtcDominance = (btcMcap: BigNumber, totalMcap: BigNumber): FixedNumber =>
  FixedNumber.from(btcMcap).divUnsafe(FixedNumber.from(totalMcap))

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id

  let btcmcap
  let totalmcap
  try {
    btcmcap = await getMarketCapValue(config.btcMcapAddress, config)
    totalmcap = await getMarketCapValue(config.totalMcapAddress, config)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const btcDominance = calculateBtcDominance(btcmcap, totalmcap).toString()

  const response = {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: { btcDominance },
  }
  return Requester.success(jobRunID, Requester.withResult(response, btcDominance), config.verbose)
}
