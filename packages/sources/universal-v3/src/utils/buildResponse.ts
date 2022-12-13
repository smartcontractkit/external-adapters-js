import type { AxiosRequestConfig } from 'axios'
import type { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import type { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from '..'

export interface Response {
  Data: {
    result: hexstring | ''
    error: hexstring | ''
    errorString?: string
    details?: string
    userHttpQueries?: AxiosRequestConfig[]
  }
  Result: 'success' | 'error'
}

export type SandboxOutput = SandboxSuccess | SandboxError

type hexstring = `0x${string}`

interface SandboxSuccess {
  success: hexstring
  userHttpQueries: AxiosRequestConfig[]
}

interface SandboxError {
  error: {
    name: string
    message: string
    details?: string
    userHttpQueries?: AxiosRequestConfig[]
  }
}

export class ResponseBuilder {
  public maxResponseBytes: number

  constructor(config: AdapterConfig<typeof customSettings>) {
    this.maxResponseBytes = config.MAX_RESPONSE_BYTES
  }

  public buildResponse = (sandboxOutputString: unknown): AdapterResponse<Response> => {
    let sandboxOutput
    try {
      sandboxOutput = JSON.parse(sandboxOutputString as string)
    } catch {
      return this.buildGenericUserErrorResponse('Invalid output from source code')
    }

    if (this.isValidSandboxError(sandboxOutput)) {
      return this.buildSandboxUserErrorResponse(sandboxOutput)
    }

    if (this.isValidSandboxSuccess(sandboxOutput)) {
      return {
        result: 'success',
        data: {
          result: sandboxOutput.success,
          error: '',
          userHttpQueries: sandboxOutput.userHttpQueries,
        },
        statusCode: 200,
        timestamps: {
          providerDataReceived: NaN,
          providerDataRequested: NaN,
          providerIndicatedTime: NaN,
        },
      }
    }

    return this.buildGenericUserErrorResponse('Invalid output from source code')
  }

  public buildSandboxUserErrorResponse = (
    sandboxOutput: SandboxError,
  ): AdapterResponse<Response> => {
    const errorString = `${sandboxOutput.error.name}: ${sandboxOutput.error.message}`

    return {
      result: 'error',
      data: {
        result: '',
        error: this.stringToValidHexString(errorString),
        errorString,
        details: sandboxOutput.error.details,
        userHttpQueries: sandboxOutput.error.userHttpQueries,
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: NaN,
        providerDataRequested: NaN,
        providerIndicatedTime: NaN,
      },
    }
  }

  public buildGenericUserErrorResponse = (errorString: string): AdapterResponse<Response> => {
    return {
      result: 'error',
      data: {
        result: '',
        error: this.stringToValidHexString(errorString),
        errorString,
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: NaN,
        providerDataRequested: NaN,
        providerIndicatedTime: NaN,
      },
    }
  }

  private isValidSandboxSuccess = (unknownResponse: unknown): unknownResponse is SandboxSuccess => {
    if (typeof unknownResponse !== 'object') {
      return false
    }

    const successResponse = unknownResponse as SandboxSuccess

    return (
      this.isValidHexString(successResponse.success) &&
      Array.isArray(successResponse.userHttpQueries)
    )
  }

  private isValidHexString = (result: unknown): result is hexstring => {
    // 0x0 is a represents empty bytes according to the Solidity docs
    const hexStringRegex = /^0x[0-9A-Fa-f]+$/g
    return (
      typeof result === 'string' &&
      // Test for a prefixed hex string
      hexStringRegex.test(result) &&
      // 0x0 is a represents empty bytes according to the Solidity docs, otherwise length should be even
      (result === '0x0' || result.length % 2 === 0) &&
      // Response should be under the maximum bytes limit
      (result.length - 2) * 2 <= this.maxResponseBytes
    )
  }

  private isValidSandboxError = (unknownResponse: unknown): unknownResponse is SandboxError => {
    if (typeof unknownResponse === 'object') {
      const sandboxResponse = unknownResponse as SandboxError

      return (
        typeof sandboxResponse.error === 'object' &&
        (!sandboxResponse.error.message || typeof sandboxResponse.error.message === 'string') &&
        (!sandboxResponse.error.details || typeof sandboxResponse.error.details === 'string') &&
        (!sandboxResponse.error.userHttpQueries ||
          Array.isArray(sandboxResponse.error.userHttpQueries))
      )
    }

    return false
  }

  private stringToValidHexString = (input: string): hexstring | '' => {
    if (input.length === 0) {
      return '0x0'
    }

    const buf = Buffer.from(input)

    // Curtail the input string bytes if it is too large
    const shortBuf = buf.subarray(0, this.maxResponseBytes)

    return ('0x' + shortBuf.toString('hex')) as hexstring
  }
}
