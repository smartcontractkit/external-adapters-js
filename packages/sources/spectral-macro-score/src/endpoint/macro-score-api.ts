import { Requester, AdapterError } from '@chainlink/ea-bootstrap'
import { InputParameters, RequestConfig } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { getTickSet } from '../abi/NFC'
import { getNFCAddress } from '../abi/NFCRegistry'
import { SpectralAdapterConfig } from '../config'

//const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const MacroScoreAPIName = 'submit'

export interface ICustomError {
  Response: string
}

export const supportedEndpoints = ['spectral-proxy']

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
  unsigned_addresses: string[]
  primary_address: string
}
export interface CalculationResponse {
  primary_address: string
  message: string
}
export interface ResolveResponse {
  score: string // numeric,
  message: string
}

export const inputParameters: InputParameters = {
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
  const unsignedAddresses = addressResponse.data.unsigned_addresses
  const addresses = addressResponse.data.signed_addresses
  const primaryAddress = addressResponse.data.primary_address

  if (!primaryAddress) {
    throw new AdapterError({
      message: 'FastAPI Error: Primary address does not exist on FAST API',
      cause: 'Primary address does not exist on FAST API',
    })
  }

  if (unsignedAddresses.length > 0) {
    throw new AdapterError({
      message: 'FastAPI Error: The bundle contains unsigned addresses',
      cause: 'The bundle contains unsigned addresses',
    })
  }

  const primaryUnsigned = unsignedAddresses.find(
    (address: String) => address.toLowerCase() === primaryAddress.toLowerCase(),
  )

  if (primaryUnsigned) {
    throw new AdapterError({
      message: 'FastAPI Error: Primary is unsigned',
      cause: 'Primary is unsigned',
    })
  }

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
      username: primaryAddress,
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

  if (
    calculateReponse &&
    primaryAddress &&
    !(calculateReponse.data.message === 'address and user already exist')
  ) {
    if (primaryAddress !== calculateReponse.data.primary_address) {
      throw new AdapterError({
        message: 'FastAPI + Macro API error',
        cause: 'Primary address is different in FAST API and MACRO Score API',
      })
    }
  }

  const resolveOptions: RequestConfig = {
    baseURL: `${config.BASE_URL_MACRO_API}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${config.MACRO_API_KEY}`,
    },
    timeout: config.timeout,
    url: `/resolve/${primaryAddress}/`,
    method: 'GET',
  }

  let resolve = await Requester.request<ResolveResponse>(
    resolveOptions,
    customErrorResolve,
    25,
    4000,
  )

  const score = Requester.validateResultNumber(resolve.data, ['score'])

  if (!score) {
    const message = Requester.getResult(resolve.data as { [key: string]: any }, ['message'])

    if (message === 'Failed') {
      console.log(`Calculation failed at the macro-api level`)
      return Requester.success(
        request.data.jobRunID,
        Requester.withResult(resolve, `Calculation failed at the macro-api level`),
      )
    } else {
      return Requester.success(
        request.data.jobRunID,
        Requester.withResult(resolve, `Calculation failed at the macro-api level with no message`),
      )
    }
  }
  const tick = computeTickWithScore(score, tickSet)

  console.log(`Tick ${tick} fulfilled for primary address ${primaryAddress}!`)
  return Requester.success(request.data.jobRunID, Requester.withResult(resolve, tick))
}
