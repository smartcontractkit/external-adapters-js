import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { getTickSet } from '../abi/NFC'
import { getNFCAddress } from '../abi/NFCRegistry'
import { SpectralAdapterConfig } from '../config'

export const MacroScoreAPIName = 'run_proxy'

export interface ICustomError {
  Response: string
}

const customError = (data: ICustomError) => {
  if (data.Response === 'Error') return true
  return false
}

export interface IRequestInput {
  id: string // numeric
  data: {
    tokenIdHash: string // bytes32Hash
    tickSetId: string // numeric
    jobRunID: string // numeric
  }
}

export interface ScoreResponse {
  body: {
    score: string // numeric
  }
}

export const computeTickWithScore = (score: number, tickSet: BigNumber[]): number => {
  for (const [index, tick] of tickSet.entries()) {
    if (tick.toNumber() > score) return index + 1
  }
  return tickSet.length // returns the last (greatest) tick
}

export const execute = async (request: IRequestInput, config: SpectralAdapterConfig) => {
  const options: RequestConfig = {
    ...config.api,
    timeout: config.timeout,
    url: '/run_proxy',
    method: 'POST',
    data: {
      tokenIdHash: `${request.data.tokenIdHash}`,
    },
  }

  const nfcAddress = await getNFCAddress(config.nfcRegistryAddress, config.rpcUrl)
  const tickSet = await getTickSet(nfcAddress, config.rpcUrl, request.data.tickSetId)
  const response = await Requester.request<ScoreResponse>(options, customError)
  const score = Requester.validateResultNumber(response.data.body, ['score'])
  const tick = computeTickWithScore(score, tickSet)

  return Requester.success(request.data.jobRunID, Requester.withResult(response, tick))
}
