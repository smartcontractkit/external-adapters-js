import { HTTP } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AxiosResponse, RequestConfig } from '@chainlink/types'

export type PriceAdapter = (input: AdapterRequest) => Promise<AxiosResponse>

export const getDataProvider =
  (apiConfig: RequestConfig): PriceAdapter =>
  async (input) =>
    HTTP.request({ ...apiConfig, data: input })
