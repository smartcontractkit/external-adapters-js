import { Requester } from '@chainlink/external-adapter'
import { ExternalFetch } from './adapter'

export const fetchXbto: ExternalFetch = async (): Promise<number> => {
  const url = 'https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com/api'

  const auth = {
    password: process.env.XBTO_API_KEY,
  }

  const config = {
    url,
    auth,
  }

  const response = await Requester.request(config)
  return Requester.validateResultNumber(response.data, ['index'])
}
