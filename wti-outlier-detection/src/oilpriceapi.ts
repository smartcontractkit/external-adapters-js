import { Requester } from '@chainlink/external-adapter'
import { ExternalFetch } from './adapter'

export const fetchOilpriceapi: ExternalFetch = async (): Promise<number> => {
  const url = 'https://api.oilpriceapi.com/v1/prices/latest'
  const by_code = 'WTI_USD'

  const params = {
    by_code,
  }

  const headers = {
    Authorization: `Token ${process.env.OILPRICEAPI_API_KEY}`,
  }

  const config = { url, params, headers }

  const response = await Requester.request(config)
  return Requester.validateResultNumber(response.data, ['data', 'price'])
}
