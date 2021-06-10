import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const Name = 'assetAttestation'

const customError = (data: any) => data.Response === 'Error'

type RequestData = {
  asset: string
}

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

const toAttestation = async (config: Config, asset: string): Promise<Attestation> => {
  const url = getAttestationURI(asset)
  const reqConfig = {
    ...config.api,
    url
  }

  const response = await Requester.request(reqConfig, customError)
  return {
    asset: asset,
    auditorName: response.data.auditorName,
    lastAttestedAt: response.data.lastAttestedAt,
    amount: Requester.validateResultNumber(response.data, ['amount']),
    verified: response.data.verified,
  }
}

export const execute = async (config: Config, data: RequestData): Promise<Attestation> => {
  const asset = data.asset

  if (!asset) throw Error('asset must be provided')

  return await toAttestation(config, asset)
}
