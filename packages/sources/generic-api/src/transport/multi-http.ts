import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import objectPath from 'object-path'
import { BaseEndpointTypes } from '../endpoint/multi-http'
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
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `The data provider for ${param.apiName} didn't return any value`,
          statusCode: 502,
        },
      }))
    }

    return params.map((param) => {
      // Check ripcord
      if (
        param.ripcordPath !== undefined &&
        objectPath.has(response.data, param.ripcordPath) &&
        objectPath.get(response.data, param.ripcordPath).toString() !== param.ripcordDisabledValue
      ) {
        // Look for ripcordDetails as sibling field (e.g., ripcord -> ripcordDetails)
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
            ripcordDetails,
            statusCode: 503,
          },
        }
      }

      // Extract all dataPaths
      const data: { [key: string]: number | string | boolean } = {}

      for (const { name, path } of param.dataPaths) {
        if (!objectPath.has(response.data, path)) {
          return {
            params: param,
            response: {
              errorMessage: `Data path '${path}' not found in response for '${param.apiName}'`,
              statusCode: 500,
            },
          }
        }
        const value = objectPath.get(response.data, path)
        data[name] = value as number | string
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

      // Extract primary result from data
      const result = (data['result'] as number | string) ?? null

      // Add ripcord status to data if ripcordPath was checked (following the-network-firm pattern)
      if (param.ripcordPath !== undefined && objectPath.has(response.data, param.ripcordPath)) {
        data.ripcord = objectPath.get(response.data, param.ripcordPath) as boolean
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
export class MultiHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const multiHttpTransport = new MultiHttpTransport()
