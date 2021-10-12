import { Requester, AdapterError } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { getTickSet } from '../abi/NFC'
import { getNFCAddress } from '../abi/NFCRegistry'
import { SpectralAdapterConfig } from '../config'

//const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const MacroScoreAPIName = 'submit'

export interface ICustomError {
  Response: string
}

const customError = (data: ICustomError) => {
  if (data.Response === 'Error') return true
  return false
}

export interface IResolveResult {
  message: string
}

const customErrorResolve = (data: IResolveResult) => {
  if (data.message === 'calculating') return true
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
  primary_address: string
  message: string
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
    baseURL: `${config.BASE_URL_FAST_API}`,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: config.timeout,
    url: '/availAddressesEA/',
    method: 'POST',
    data: {
      key: `${config.FAST_API_KEY}`,
      tokenId: `${request.data.tokenIdHash}`,
    },
  }

  const addressResponse = await Requester.request<AddressesResponse>(addressOptions, customError)
  const addresses = addressResponse.data.signed_addresses

  const calculateOptions: RequestConfig = {
    baseURL: `${config.BASE_URL_MACRO_API}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${config.MACRO_API_KEY}`,
    },
    timeout: config.timeout,
    url: '/submit/',
    method: 'POST',
    data: {
      addresses,
    },
  }

  const RPCProvider = `${config.INFURA_URL}${config.INFURA_API_KEY}`
  const nfcAddress = await getNFCAddress(config.NFC_REGISTRY_ADDRESS, RPCProvider)
  const tickSet = await getTickSet(nfcAddress, RPCProvider, request.data.tickSetId)

  const calculateReponse = await Requester.request<CalculationResponse>(
    calculateOptions,
    customError,
  )
  let primary_address
  console.log(calculateReponse.data)
  if (calculateReponse && !(calculateReponse.data.message === 'address and user already exist')) {
    primary_address = calculateReponse.data.primary_address
  } else if (
    calculateReponse &&
    calculateReponse.data.message === 'address and user already exist' &&
    addresses[0]
  ) {
    primary_address = addresses[0]
  } else {
    throw new AdapterError({
      message: 'FastAPI + Macro API error',
      cause: 'Addresses exists in MACRO API but bundle is empty on FAST API',
    })
  }

  console.log('PRIMARY , ', primary_address)
  const resolveOptions: RequestConfig = {
    baseURL: `${config.BASE_URL_MACRO_API}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${config.MACRO_API_KEY}`,
    },
    timeout: config.timeout,
    url: `/resolve/${primary_address}/`,
    method: 'GET',
  }

  let resolve = await Requester.request<ResolveResponse>(
    resolveOptions,
    customErrorResolve,
    25,
    4000,
  )

  const score = Requester.validateResultNumber(resolve.data, ['score'])

  const tick = computeTickWithScore(score, tickSet)

  console.log(`Tick ${tick} fulfilled for primary address ${primary_address}!`)
  return Requester.success(request.data.jobRunID, Requester.withResult(resolve, tick))
}
