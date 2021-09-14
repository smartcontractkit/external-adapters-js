import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { getTickSet } from '../abi/NFC'
import { SpectralAdapterConfig } from '../config'

export const MacroScoreAPIName = 'spectral-proxy'

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
    tokenIdInt: string // numeric
    tickSetId: string // numeric
    jobRunID: string // numeric
  }
}

export interface ScoreResponse {
  address: string
  score_aave: string // numeric
  score_comp: string // numeric
  score: string // numeric
  updated_at: string // ISO UTC string
  is_updating_aave: boolean
  is_updating_comp: boolean
  result: number
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
    url: '/spectral-proxy',
    method: 'POST',
    data: {
      tokenInt: `${request.data.tokenIdInt}`,
    },
  }
  const tickSet = await getTickSet(config.nfcAddress, config.rpcUrl, request.data.tickSetId)
  const response = await Requester.request<ScoreResponse[]>(options, customError)
  const score = Requester.validateResultNumber(response.data[0], ['score'])
  const tick = computeTickWithScore(score, tickSet)
  return Requester.success(
    request.data.jobRunID,
    Requester.withResult(response, tick),
    config.verbose,
  )
}
