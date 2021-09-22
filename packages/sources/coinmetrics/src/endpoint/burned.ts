import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { ethers } from 'ethers'

export const DEFAULT_FREQUENCY = '1d'
export const DEFAULT_PAGE_SIZE = 1

export const supportedEndpoints = ['burned']

export interface ResponseSchema {
  data: [
    {
      asset: string
      time: string
      FeeTotNtv: string
      IssTotNtv: string
      RevNtv: string
    },
  ]
  next_page_token: string
  next_page_url: string
}

export const inputParameters: InputParameters = {
  asset: true,
  frequency: false,
  pageSize: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.overrideSymbol(AdapterName, validator.validated.data.asset)
  const frequency = validator.validated.data.frequency || DEFAULT_FREQUENCY
  const pageSize = validator.validated.data.pageSize || DEFAULT_PAGE_SIZE
  const url = 'timeseries/asset-metrics'
  const metrics = 'FeeTotNtv,RevNtv,IssTotNtv'

  const params = {
    assets: (asset as string).toLowerCase(),
    metrics,
    frequency,
    api_key: config.apiKey,
    page_size: pageSize,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options)
  const FeeTotNtv = ethers.utils.parseEther(response.data.data[0].FeeTotNtv)
  const RevNtv = ethers.utils.parseEther(response.data.data[0].RevNtv)
  const IssTotNtv = ethers.utils.parseEther(response.data.data[0].IssTotNtv)
  const result = FeeTotNtv.sub(RevNtv.sub(IssTotNtv))

  return Requester.success(
    jobRunID,
    Requester.withResult(response, ethers.utils.formatEther(result)),
    config.verbose,
  )
}
