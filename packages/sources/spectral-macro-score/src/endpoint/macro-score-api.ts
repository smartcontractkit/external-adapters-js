import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterResponse } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { getTickSet } from '../abi/NFC'
import { SpectralAdapterConfig } from '../config'

export const MacroScoreAPIName = 'spectral-proxy' // This should be filled in with a lowercase name corresponding to the API endpoint

export interface ICustomError {
  Response: string
}

const customError = (data: ICustomError) => {
  if (data.Response === 'Error') return true
  return false
}

export interface RequestResponseResult {
  address: string
  score_aave: string // numeric
  score_comp: string // numeric
  score: string // numeric
  updated_at: string // ISO UTC string
  is_updating_aave: boolean
  is_updating_comp: boolean
  result: number
}

export interface ScoreRequestResponse {
  data: RequestResponseResult[]
  status: number
}

export interface IRequestInput {
  id: string // numeric
  data: {
    tokenIdInt: string // numeric
    tickSetId: string // numeric
    jobRunID: string // numeric
  }
}

const computeTickWithScore = (score: number, tickSet: BigNumber[]) => {
  for (const [index, tick] of tickSet.entries()) {
    if (tick.toNumber() > score) return index
  }
  return tickSet.length - 1 // returns the last (greatest) tick
}

export const execute = async (
  request: IRequestInput,
  config: SpectralAdapterConfig,
): Promise<AdapterResponse> => {
  const options = {
    url: config.api,
    method: 'POST',
    data: `{"tokenInt":"${request.data.tokenIdInt}"}`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey ?? '',
    },
    timeout: 30000,
  }
  const tickSet = await getTickSet(config.nfcAddress, config.rpcUrl, request.data.tickSetId)
  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data[0], ['score'])
  const tick = computeTickWithScore(response.data[0].score, tickSet)
  return Requester.success(request.data.jobRunID, { data: { result: tick } }, config.verbose)
}
