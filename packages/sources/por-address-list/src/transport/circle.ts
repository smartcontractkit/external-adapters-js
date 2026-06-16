import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { isValidBitcoinAddress } from '@chainlink/external-adapter-framework/validation/address'
import { BaseEndpointTypes } from '../endpoint/circle'

export interface ResponseSchema {
  data: {
    address: string
  }[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

// Exported for testing
export class CircleTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super({
      prepareRequests: (params, config) => {
        return params.map((param) => {
          return {
            params: [param],
            request: {
              baseURL: config.CIRCLE_API_URL,
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
                errorMessage: `The data provider didn't return any value`,
                statusCode: 502,
              },
            }
          })
        }

        for (const { address } of response.data.data) {
          if (!isValidBitcoinAddress(address)) {
            return params.map((param) => {
              return {
                params: param,
                response: {
                  errorMessage: `Invalid Bitcoin address returned from data provider: '${address}'`,
                  statusCode: 502,
                },
              }
            })
          }
        }

        return params.map((param) => {
          return {
            params: param,
            response: {
              result: null,
              data: {
                result: response.data.data.map((item) => ({
                  address: item.address,
                  network: 'bitcoin',
                  chainId: 'mainnet',
                })),
              },
            },
          }
        })
      },
    })
  }
}

export const circleTransport = new CircleTransport()
