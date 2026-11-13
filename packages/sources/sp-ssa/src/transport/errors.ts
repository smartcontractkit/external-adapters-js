import { ResponseTimestamps } from '@chainlink/external-adapter-framework/util'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'

export function errorMessage(error: unknown): string {
  if (error instanceof AdapterDataProviderError) {
    return `The data provider request failed with status ${error.providerStatusCode ?? 'unknown'}`
  }
  if (error instanceof AdapterError) {
    return error.message
  }
  return error instanceof Error ? error.message : 'Unknown error occurred'
}

export function errorTimestamps(error: unknown): ResponseTimestamps {
  if (error instanceof AdapterDataProviderError || error instanceof AdapterConnectionError) {
    return error.timestamps
  }
  return {
    providerDataRequestedUnixMs: 0,
    providerDataReceivedUnixMs: 0,
    providerIndicatedTimeUnixMs: undefined,
  }
}
