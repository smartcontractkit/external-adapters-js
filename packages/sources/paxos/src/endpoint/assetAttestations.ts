import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, AdapterRequest } from '@chainlink/types'
import { DEFAULT_BASE_URL } from '../config'

export const supportedEndpoints = ['assetAttestation']

const customError = (data: any) => data.Response === 'Error'

export const inputParams = {
  asset: true,
}

type Attestation = {
   asset: string
  auditorName: string
  lastAttestedAt: string
  amount: number
  verified: boolean
}

const getAttestationURI = (asset: string) => `/asset-attestations/${asset.toUpperCase()}`

export const execute:ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error
  const asset = validator.validated.data.asset
  const jobRunID = validator.validated.id

  if (!asset) throw Error('asset must be provided')

  const url = getAttestationURI(asset)
  const reqConfig = { ...config.api, baseURL: DEFAULT_BASE_URL, url }

  const response = await Requester.request<Attestation>(reqConfig, customError)

  const output = {
    asset: asset,
    auditorName: response.data.auditorName,
    lastAttestedAt: response.data.lastAttestedAt,
    amount: Requester.validateResultNumber(response.data, ['amount']),
    verified: response.data.verified,
  }

  response.data = output

  return Requester.success(jobRunID, Requester.withResult(response, response.data.amount))
}
