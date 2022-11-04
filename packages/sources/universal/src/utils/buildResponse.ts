import { Logger } from '@chainlink/ea-bootstrap'
import type { AxiosResponse } from '@chainlink/ea-bootstrap'
import type { SandboxResponse } from '../endpoint/sandbox'

export interface UniversalAdapterResponse {
  jobRunID: string
  statusCode: number
  result: string
  error: string
  errorString?: string
  data: {
    result: string
    error: string
    errorString?: string
  }
  providerStatusCode?: number
}

// a hexstring will start with '0x'
type hexstring = string

export const buildAdapterResponse = (
  jobRunID: string,
  maxResponseBytes: number,
  buildErrorResponse: (errorString: string) => UniversalAdapterResponse,
  sandboxResponse: AxiosResponse<SandboxResponse>,
): UniversalAdapterResponse => {
  if (sandboxResponse.data.error) {
    const adapterResponse = buildErrorResponse(
      `${sandboxResponse.data.error.name ?? ''}: ${sandboxResponse.data.error.message ?? ''}`,
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

  const adapterResponse = buildErrorResponse(
    'returned value must be a valid hex string with an even length',
  )
  Logger.debug({ requestStartTime: Date.now() })
  return adapterResponse
}

const isHexString = (result?: unknown): result is string => {
  if (typeof result !== 'string' || result.slice(0, 2) !== '0x' || result.length % 2 !== 0)
    return false
  const hexstringRegex = /[0-9A-Fa-f]/g
  return hexstringRegex.test(result.slice(2))
}

export const buildErrorResponseFactory = (jobRunID: string, maxResponseBytes: number) => {
  return (errorString: string): UniversalAdapterResponse => {
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
    adapterResponse.error = buildErrorHexString(adapterResponse.errorString, maxResponseBytes)
    adapterResponse.data.error = adapterResponse.error
    return adapterResponse
  }
}

export const buildErrorHexString = (errorString: string, maxResponseBytes: number): hexstring => {
  const buf = Buffer.from(errorString)
  const shortBuf = buf.subarray(0, maxResponseBytes - 2)
  if (shortBuf.length % 2 === 0) return '0x' + shortBuf.toString('hex')
  return '0x0' + shortBuf.toString('hex')
}
