import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, IndexValues } from '../endpoint/batch-index'

const logger = makeLogger('BatchIndexTransport')

export interface RequestSchema {
  seriesid: string[]
  latest: boolean
  calculations: boolean
  registrationkey: string
}

export interface ResponseSchema {
  status: string
  message: string[]
  Results: {
    series: {
      seriesID: string
      data: {
        value: string
        calculations: {
          pct_changes: {
            '1': string
            '12': string
          }
        }
      }[]
    }[]
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: RequestSchema
    ResponseBody: ResponseSchema
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          method: 'POST',
          baseURL: config.API_ENDPOINT,
          data: {
            seriesid: param.indices,
            latest: true,
            calculations: true,
            registrationkey: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    logger.trace(`status: ${response.data?.status}, message: ${response.data?.message}`)

    if (!response.data?.Results?.series) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any values for series ${param.indices}`,
            statusCode: 502,
          },
        }
      })
    }

    // map results data to response values
    const allSeries = response.data.Results.series
    const seriesIdDataMap: Map<string, IndexValues> = new Map()

    for (const series of allSeries) {
      const seriesId = series.seriesID
      const seriesData = series.data[0]

      // catch null and undefined but allow 0
      if (
        seriesData.value == null ||
        seriesData.calculations.pct_changes['1'] == null ||
        seriesData.calculations.pct_changes['12'] == null
      ) {
        return params.map((param) => {
          return {
            params: param,
            response: {
              errorMessage: `Incomplete data for ${seriesId}`,
              statusCode: 502,
            },
          }
        })
      }

      seriesIdDataMap.set(seriesId, {
        level: parseFloat(seriesData.value),
        pct1mo: parseFloat(seriesData.calculations.pct_changes['1']),
        pct12mo: parseFloat(seriesData.calculations.pct_changes['12']),
      })
    }

    return params.map((param) => {
      // ensure all ids are present
      const data: Record<string, IndexValues> = {}
      for (const id of param.indices) {
        const indexValues = seriesIdDataMap.get(id)
        if (!indexValues) {
          return {
            params: param,
            response: {
              errorMessage: `Missing values for ${id}`,
              statusCode: 502,
            },
          }
        }
        data[id] = indexValues
      }

      return {
        params: param,
        response: {
          result: null,
          data,
        },
      }
    })
  },
}

export class IndexTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const transport = new IndexTransport()
