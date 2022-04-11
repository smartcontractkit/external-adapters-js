import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
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

const getAttestationURI = (asset: string) =>
  util.buildUrlPath('/asset-attestations/:asset', { asset: asset.toUpperCase() })

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const asset = validator.validated.data.asset
  const jobRunID = validator.validated.id

  if (!asset) throw Error('asset must be provided')

  const url = getAttestationURI(asset)
  const reqConfig = { ...config.api, baseURL: DEFAULT_BASE_URL, url }

  const response = await Requester.request<Attestation>(reqConfig)

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
