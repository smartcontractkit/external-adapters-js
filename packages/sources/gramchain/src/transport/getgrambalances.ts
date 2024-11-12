import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/getgrambalances'

export type ResponseSchema = {
  VaultID: string
  MetalCode: string
  CustodianID: string
  UtilizationLockCode: string
  EntityID: string
  ItemCategoryCode: string
  NrParcels: number
  PureGrams: number
  GrossGrams: number
  FixedValuation: number
  AsOfUTC: string
  MetalName: string
  CategoryName: string
  ParcelGrouping: string
  Valuation: number
}[]

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
          url: '/getgrambalances',
          params: {
            custodianID: param.custodianID,
            metalCode: param.metalCode,
            utilizationLockCode: param.utilizationLockCode,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param) => {
      const result = parseFloat(
        response.data
          .reduce((sum, item) => {
            if (item.PureGrams && typeof item.PureGrams === 'number') {
              return sum + item.PureGrams
            }
            return sum
          }, 0)
          .toFixed(4),
      )

      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(response.data[0].AsOfUTC).getTime(),
          },
        },
      }
    })
  },
})
