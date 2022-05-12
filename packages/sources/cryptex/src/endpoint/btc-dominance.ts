import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { BigNumber, FixedNumber, ethers } from 'ethers'
import EACAggregatorProxyAbi from '../abis/EACAggregatorProxy.json'
import { LatestRoundResponse } from '../types'
import { Config } from '../config'

export const supportedEndpoints = ['btc-dominance', 'dominance']
export const description = 'Endpoint to calculate BTC dominance'
export const inputParameters: InputParameters = {}

const getMarketCapValue = async (address: string, config: Config): Promise<BigNumber> => {
  const contract = new ethers.Contract(address, EACAggregatorProxyAbi, config.provider)
  const data: LatestRoundResponse = await contract.latestRoundData()
  return data.answer
}

const calculateBtcDominance = (btcMcap: BigNumber, totalMcap: BigNumber): FixedNumber =>
  FixedNumber.from(btcMcap).divUnsafe(FixedNumber.from(totalMcap))

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)
  const jobRunID = validator.validated.id

  const btcmcap = await getMarketCapValue(config.btcMcapAddress, config)
  const totalmcap = await getMarketCapValue(config.totalMcapAddress, config)
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
