import BigNumber from 'bignumber.js'
import { TimestampedProviderErrorResponse } from '@chainlink/external-adapter-framework/util'

const GWEI_DIVISOR = 1000000000

export const chunkArray = (addresses: string[], size: number): string[][] =>
  addresses.length > size
    ? [addresses.slice(0, size), ...chunkArray(addresses.slice(size), size)]
    : [addresses]

// Value must be in wei
export function formatValueInGwei(value: BigNumber): string {
  return value.div(GWEI_DIVISOR).toString()
}

export const buildErrorResponse = (
  errorMessage: string,
  providerDataRequestedUnixMs: number,
): TimestampedProviderErrorResponse => {
  return {
    statusCode: 500,
    errorMessage,
    timestamps: {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}
