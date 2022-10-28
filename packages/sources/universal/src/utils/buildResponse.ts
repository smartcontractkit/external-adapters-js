import { Logger } from '@chainlink/ea-bootstrap'
import type { AxiosResponse } from '@chainlink/ea-bootstrap'
import type { SandboxResponse } from '../endpoint/sandbox'

export interface UniversalAdapterResponse {
  jobRunID: string
  statusCode: number
  result: string
  error: string
  errorString?: string
  details?: string
  data: {
    result: string
    error: string
    errorString?: string
    details?: string
  }
  providerStatusCode?: number
}

// a hexstring will start with '0x'
type hexstring = string

export const buildAdapterResponse = (
  jobRunID: string,
  maxResponseBytes: number,
  buildErrorResponse: (errorString: string, details?: string) => UniversalAdapterResponse,
  sandboxResponse: AxiosResponse<SandboxResponse>,
): UniversalAdapterResponse => {
  if (sandboxResponse.data.error) {
    const adapterResponse = buildErrorResponse(
      `${sandboxResponse.data.error.name ?? ''}: ${sandboxResponse.data.error.message ?? ''}`,
      sandboxResponse.data.error.details,
    )
    adapterResponse.providerStatusCode = sandboxResponse.status
    Logger.error(adapterResponse)
    return adapterResponse
  }

  if (isHexString(sandboxResponse.data.success)) {
    // each hex char encodes 1/2 of a byte (excluding preceeding '0x')
    if (sandboxResponse.data.success.length - 2 > maxResponseBytes * 2) {
      const adapterResponse = buildErrorResponse(
        `returned value is larger than ${maxResponseBytes} bytes`,
      )
      adapterResponse.providerStatusCode = sandboxResponse.status
      Logger.error(adapterResponse)
      return adapterResponse
    }
    const adapterResponse = {
      jobRunID,
      statusCode: 200,
      result: sandboxResponse.data.success,
      error: '',
      data: {
        result: sandboxResponse.data.success,
        error: '',
      },
      providerStatusCode: sandboxResponse.status,
    }
    Logger.debug(adapterResponse)
    return adapterResponse
  }

  const adapterResponse = buildErrorResponse('source code did not return a valid hex string')
  Logger.debug({ requestStartTime: Date.now() })
  return adapterResponse
}

const isHexString = (result?: unknown): result is string => {
  if (typeof result !== 'string' || result.slice(0, 2) !== '0x') return false
  const hexstringRegex = /[0-9A-Fa-f]/g
  return hexstringRegex.test(result.slice(2))
}

export const buildErrorResponseFactory = (jobRunID: string, maxResponseBytes: number) => {
  return (errorString: string, details?: string): UniversalAdapterResponse => {
    const adapterResponse = {
      jobRunID,
      statusCode: 200,
      data: {
        result: '',
      },
      result: '',
    } as UniversalAdapterResponse
    adapterResponse.errorString = errorString
    adapterResponse.data.errorString = adapterResponse.errorString
    adapterResponse.details = details
    adapterResponse.data.details = details
    adapterResponse.error = buildErrorHexString(adapterResponse.errorString, maxResponseBytes)
    adapterResponse.data.error = adapterResponse.error
    return adapterResponse
  }
}

export const buildErrorHexString = (errorString: string, maxResponseBytes: number): hexstring => {
  const buf = Buffer.from(errorString)
  const shortBuf = buf.subarray(0, maxResponseBytes - 2)
  return '0x' + shortBuf.toString('hex')
}
