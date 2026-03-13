import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/proof-of-insurance'

export interface ResponseSchema {
  treeId: string
  root: string
  contractId: string
  computedAt: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/v1/chainlink/${encodeURIComponent(param.deal_name)}/${encodeURIComponent(
            param.instrument_id,
          )}`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${config.TRIZE_API_TOKEN}`,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for deal_name=${param.deal_name}, instrument_id=${param.instrument_id}`,
            statusCode: 502,
          },
        }
      })
    }

    if (response.data?.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: response.data.error,
            statusCode: 502,
          },
        }
      })
    }

    const navPerShare = BigInt(
      '0x' + Buffer.from(response.data.root, 'base64').toString('hex'),
    ).toString()

    const aum = BigInt('0x' + response.data.contractId).toString()

    const navDate = (BigInt(new Date(response.data.computedAt).getTime()) * 1_000_000n).toString()

    return params.map((param) => {
      return {
        params: param,
        response: {
          result: navPerShare,
          data: {
            navPerShare,
            aum,
            navDate,
            ripcord: 0,
          },
        },
      }
    })
  },
})
