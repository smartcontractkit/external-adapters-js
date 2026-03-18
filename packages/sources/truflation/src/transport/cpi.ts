import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/cpi'

export interface ResponseSchema {
  index: string[] // dates as string
  truflation_us_cpi_frozen_index: number[]
  start_date: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          headers: {
            Authorization: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    const data = response.data
    if (
      !data?.index?.length ||
      !data?.truflation_us_cpi_frozen_index?.length ||
      data.index.length !== data.truflation_us_cpi_frozen_index.length
    ) {
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

    const originalIndexArrayCopy = Array.from(data.index)
    // filter response, .sort() sorts ascending by default
    const sortedIndexArray = originalIndexArrayCopy.sort()
    const latestDate = sortedIndexArray[sortedIndexArray.length - 1]
    const mappedIndex = data.index.indexOf(latestDate)
    const result = data.truflation_us_cpi_frozen_index[mappedIndex]

    return params.map((param) => {
      return {
        params: param,
        response: {
          result,
          data: {
            date: latestDate,
            cpi: result,
          },
        },
      }
    })
  },
}

export class CpiTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new CpiTransport()
