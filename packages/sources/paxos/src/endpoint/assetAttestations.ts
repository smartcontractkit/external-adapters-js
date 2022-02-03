import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { DEFAULT_BASE_URL } from '../config'

export const supportedEndpoints = ['assetAttestation']

export const inputParameters: InputParameters = {
  asset: {
    required: true,
    description: 'The symbol of the currency to query',
  },
}

type Attestation = {
  asset: string
  auditorName: string
  lastAttestedAt: string
  amount: number
  verified: boolean
}

const getAttestationURI = (asset: string) => `/asset-attestations/${asset.toUpperCase()}`

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const asset = validator.validated.data.asset
  const jobRunID = validator.validated.id

  if (!asset) throw Error('asset must be provided')

  const url = getAttestationURI(asset)
  const reqConfig = { ...config.api, baseURL: DEFAULT_BASE_URL, url }

  const response = await HTTP.request<Attestation>(reqConfig)

  const output = {
    asset: asset,
    auditorName: response.data.auditorName,
    lastAttestedAt: response.data.lastAttestedAt,
    amount: HTTP.validateResultNumber(response.data, ['amount']),
    verified: response.data.verified,
  }

  response.data = output

  return HTTP.success(jobRunID, HTTP.withResult(response, response.data.amount))
}
