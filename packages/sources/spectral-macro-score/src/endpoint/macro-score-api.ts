import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { getTickSet } from '../abi/NFC'
import { getNFCAddress } from '../abi/NFCRegistry'
import { SpectralAdapterConfig } from '../config'

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const MacroScoreAPIName = 'calculate'

export interface ICustomError {
  Response: string
}

const customError = (data: ICustomError) => {
  if (data.Response === 'Error') return true
  return false
}

export interface IRequestInput {
  id: string
  data: {
    tokenIdHash: string // bytes32Hash
    tickSetId: string // numeric
    jobRunID: string
  }
}
export interface AddressesResponse {
  signed_addresses: string[]
}
export interface CalculationResponse {
  job: string
}
export interface ResolveResponse {
  score: string // numeric,
  message: string
}

export const computeTickWithScore = (score: number, tickSet: BigNumber[]): number => {
  for (const [index, tick] of tickSet.entries()) {
    if (tick.toNumber() > score) return index + 1
  }
  return tickSet.length // returns the last (greatest) tick
}

export const execute = async (request: IRequestInput, config: SpectralAdapterConfig) => {
  const addressOptions: RequestConfig = {
    baseURL: 'https://spec-address-db.herokuapp.com/v1/addressBatch',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: config.timeout,
    url: '/availAddressesEA',
    method: 'POST',
    data: {
      key: '12345',
      tokenId: `${request.data.tokenIdHash}`,
    },
  }

  const addressResponse = await Requester.request<AddressesResponse>(addressOptions, customError)
  const addresses = addressResponse.data.signed_addresses

  const calculateOptions: RequestConfig = {
    ...config.api,
    headers: {
      'Content-Type': 'application/json',
      // 'x-api-key': '501349cea25efe2dab5fa8fcdce5334aaf0025cb',
    },
    timeout: config.timeout,
    url: '/calculate/',
    method: 'POST',
    data: {
      addresses,
      username: `${request.data.tokenIdHash}`,
    },
  }

  const nfcAddress = await getNFCAddress(config.nfcRegistryAddress, config.rpcUrl)
  const tickSet = await getTickSet(nfcAddress, config.rpcUrl, request.data.tickSetId)

  const calculateReponse = await Requester.request<CalculationResponse>(
    calculateOptions,
    customError,
  )
  const jobId = calculateReponse.data.job

  const resolveOptions: RequestConfig = {
    ...config.api,
    timeout: config.timeout,
    url: `/resolve/job/${jobId}/`,
    method: 'GET',
  }

  let resolve = await Requester.request<ResolveResponse>(resolveOptions, customError)
  while (resolve && resolve.data.message === 'calculating') {
    await delay(2000)
    console.log(`Score not ready, calculation is pending for job id ${jobId}...`)
    resolve = await Requester.request<ResolveResponse>(resolveOptions, customError)
  }

  const score = Requester.validateResultNumber(resolve.data, ['score'])

  const tick = computeTickWithScore(score, tickSet)

  console.log(`Score fulfilled for job id ${jobId}!`)
  return Requester.success(request.data.jobRunID, Requester.withResult(resolve, tick))
}
