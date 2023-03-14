import { TimestampedProviderErrorResponse } from '@chainlink/external-adapter-framework/util'

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
