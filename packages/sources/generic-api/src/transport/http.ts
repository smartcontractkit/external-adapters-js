import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import * as objectPath from 'object-path'
import { BaseEndpointTypes } from '../endpoint/http'
import { prepareRequests } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: object
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests,
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider for ${param.apiName} didn't return any value`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      if (
        param.ripcordPath !== undefined &&
        objectPath.has(response.data, param.ripcordPath) &&
        objectPath.get(response.data, param.ripcordPath).toString() !== param.ripcordDisabledValue
      ) {
        // Look for ripcordDetails as sibling field
        const ripcordDetailsPath = `${param.ripcordPath}Details`
        let ripcordDetails: string | undefined
        if (objectPath.has(response.data, ripcordDetailsPath)) {
          const details = objectPath.get(response.data, ripcordDetailsPath)
          if (Array.isArray(details) && details.length > 0) {
            ripcordDetails = details.join(', ')
          }
        }

        const errorMessage = ripcordDetails
          ? `Ripcord activated for '${param.apiName}'. Details: ${ripcordDetails}`
          : `Ripcord activated for '${param.apiName}'`
        return {
          params: param,
          response: {
            errorMessage,
            ripcord: true,
            ripcordAsInt: 1, // 1 = paused state
            ripcordDetails,
            statusCode: 503,
          },
        }
      }

      if (!objectPath.has(response.data, param.dataPath)) {
        return {
          params: param,
          response: {
            errorMessage: `Data path '${param.dataPath}' not found in response for '${param.apiName}'`,
            statusCode: 500,
          },
        }
      }

      // Extract timestamp if providerIndicatedTimePath is provided
      let providerIndicatedTimeUnixMs: number | undefined
      if (param.providerIndicatedTimePath !== undefined) {
        if (!objectPath.has(response.data, param.providerIndicatedTimePath)) {
          return {
            params: param,
            response: {
              errorMessage: `Provider indicated time path '${param.providerIndicatedTimePath}' not found in response for '${param.apiName}'`,
              statusCode: 500,
            },
          }
        }
        const timestampValue = objectPath.get(response.data, param.providerIndicatedTimePath)
        providerIndicatedTimeUnixMs = new Date(timestampValue).getTime()

        // Validate: must be finite and positive
        if (!Number.isFinite(providerIndicatedTimeUnixMs) || providerIndicatedTimeUnixMs <= 0) {
          return {
            params: param,
            response: {
              errorMessage: `Invalid timestamp value at '${param.providerIndicatedTimePath}' for '${param.apiName}'`,
              statusCode: 500,
            },
          }
        }
      }

      const result = objectPath.get(response.data, param.dataPath).toString()

      const data: BaseEndpointTypes['Response']['Data'] = { result }

      if (param.ripcordPath !== undefined) {
        data.ripcord = false
        data.ripcordAsInt = 0 // normal state
      }

      return {
        params: param,
        response: {
          result,
          data,
          timestamps: {
            providerIndicatedTimeUnixMs,
          },
        },
      }
    })
  },
}

// Exported for testing
export class GenericApiHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new GenericApiHttpTransport()
