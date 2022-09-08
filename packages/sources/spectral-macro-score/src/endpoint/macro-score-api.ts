import {
  AdapterData,
  AdapterRequest,
  AdapterResponse,
  AxiosRequestConfig,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import { InputParameters } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers'
import { getTickSet } from '../abi/NFC'
import { SpectralAdapterConfig } from '../config'

export const MacroScoreAPIName = 'spectral-proxy'

export interface ICustomError {
  Response: string
}

export const supportedEndpoints = ['spectral-proxy']

const customError = (data: ICustomError | ScoreResponse[]) => {
  if (Array.isArray(data)) return false
  if (data.Response === 'Error') return true
  return false
}

export interface IRequestInput extends AdapterData {
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

export const description = 'Default endpoint used to retrieve a MACRO Score for a given token ID.'

export type TInputParameters = { tokenIdInt: string; tickSetId: string }
export const inputParameters: InputParameters<TInputParameters> = {
  tokenIdInt: {
    required: true,
    description: 'The tokenID for the user as an integer value',
    type: 'string',
  },
  tickSetId: {
    required: true,
    description: 'The set of ticks used to compute the MACRO Score as in integer value',
    type: 'string',
  },
}

export const computeTickWithScore = (score: number, tickSet: BigNumber[]): number => {
  for (const [index, tick] of tickSet.entries()) {
    if (tick.toNumber() > score) return index + 1
  }
  return tickSet.length // returns the last (greatest) tick
}

export const execute = async (
  request: AdapterRequest<IRequestInput>,
  config: SpectralAdapterConfig,
): Promise<AdapterResponse<AdapterData>> => {
  const validator = new Validator(request, inputParameters)

  const tokenIdInt = validator.validated.data.tokenIdInt
  const tickSetId = validator.validated.data.tickSetId

  const options: AxiosRequestConfig = {
    ...config.api,
    url: '/spectral-proxy',
    method: 'POST',
    data: {
      tokenInt: `${tokenIdInt}`,
    },
  }
  const tickSet = await getTickSet(config.nfcAddress, config.rpcUrl, tickSetId, config.chainId)
  const response = await Requester.request<ScoreResponse[]>(options, customError)
  const score = Requester.validateResultNumber(response.data[0], ['score'])
  const tick = computeTickWithScore(score, tickSet)
  return Requester.success(
    request.data.jobRunID?.toString(),
    Requester.withResult(response, tick),
    config.verbose,
  )
}
