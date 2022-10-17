import {
  AdapterError,
  AdapterResponse,
  Method,
  Requester,
  Validator,
  Logger,
  Config,
  ExecuteWithConfig,
  InputParameters,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'
import { TimestampedRequestSigner } from '../utils/timestampedRequestSigner'

export const supportedEndpoints = ['sandbox']

export interface ResponseSchema {
  success: hexstring
  error: {
    name: string
    message: string
    details: string
  }
}

export const description =
  'This adapter endpoint sends a custom request to a FaaS sandbox to be executed.'

export type TInputParameters = {
  source: string
  queries?: HttpQuery[]
  args?: string[]
  secrets?: string
  codeLocation?: 'onchain'
  secretsLocation?: 'onchain'
  language?: 'javascript'
}

export const inputParameters: InputParameters<TInputParameters> = {
  source: {
    description: 'JavaScript source code to be executed',
    required: true,
  },
  queries: {
    description: 'HTTP queries to be performed and passed to the source code',
  },
  secrets: {
    description: 'Bytes string representing an encrypted secrets object',
  },
  args: {
    description: 'Array of on-chain arguments which are passed to the source code',
  },
  codeLocation: {
    description: 'Location of user-provided code',
  },
  secretsLocation: {
    description: 'Location of user-provided secrets',
  },
  language: {
    description: 'Language of the user-provided code',
  },
}

type SandboxResponse = {
  success?: string
  error?: {
    name: string
    message: string
  }
}

type UniversalAdapterResponse = {
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

type HttpQuery = {
  HttpVerb: 'Get'
  url: string
  headers: Record<string, string>
}

// a hexstring will start with '0x'
type hexstring = string

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  Logger.debug(request)

  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const queries = validator.validated.data.queries
  const source = validator.validated.data.source
  const secrets = validator.validated.data.secrets
  const args = validator.validated.data.args

  if (
    validator.validated.data.codeLocation &&
    validator.validated.data.codeLocation.toLowerCase() !== 'onchain'
  )
    throw new AdapterError({
      jobRunID,
      statusCode: 400,
      name: 'Invalid Input',
      message: "Only 'onchain' code location is currently supported",
    })

  if (
    validator.validated.data.secretsLocation &&
    validator.validated.data.secretsLocation.toLowerCase() !== 'onchain'
  )
    throw new AdapterError({
      jobRunID,
      statusCode: 400,
      name: 'Invalid Input',
      message: "Only 'onchain' secrets location is currently supported",
    })

  if (
    validator.validated.data.language &&
    validator.validated.data.language.toLowerCase() !== 'javascript'
  )
    throw new AdapterError({
      jobRunID,
      statusCode: 400,
      name: 'Invalid Input',
      message: "Only 'javascript' code is currently supported",
    })

  // TODO: inline-replace any instance of the string `$(secrets[x])` within the URL & headers w/ decrypted secrets

  const sandboxRequestData = { queries, source, secrets, args }

  const url = config.adapterSpecificParams?.sandboxURL as string
  const privateKey = config.adapterSpecificParams?.sandboxAuthPrivateKey as string

  const signer = new TimestampedRequestSigner(privateKey)
  const signedSandboxRequestData = signer.signRequestWithTimestamp(sandboxRequestData)

  const options = {
    url,
    method: 'POST' as Method,
    data: signedSandboxRequestData,
    timeout: config.adapterSpecificParams?.sandboxTimeout as number,
  }

  const sandboxResponse = await Requester.request<ResponseSchema>(options)

  return buildAdapterResponse(
    jobRunID,
    config.adapterSpecificParams?.maxHexStringLength as number,
    sandboxResponse,
  ) as unknown as AdapterResponse
}

const buildAdapterResponse = (
  jobRunID: string,
  maxHexStringLength: number,
  sandboxResponse: AxiosResponse<ResponseSchema, SandboxResponse>,
): UniversalAdapterResponse => {
  if (sandboxResponse.data.error) {
    const adapterResponse = buildErrorResponse(
      jobRunID,
      maxHexStringLength,
      `${sandboxResponse.data.error.name ?? ''}: ${sandboxResponse.data.error.message ?? ''}`,
    )
    Logger.error(adapterResponse)
    return adapterResponse
  }

  if (isHexString(sandboxResponse.data.success)) {
    if (sandboxResponse.data.success.length > maxHexStringLength) {
      const adapterResponse = buildErrorResponse(
        jobRunID,
        maxHexStringLength,
        `returned hex string is longer than ${maxHexStringLength} characters`,
      )
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
    }
    Logger.debug(adapterResponse)
    return adapterResponse
  }

  const adapterResponse = buildErrorResponse(
    jobRunID,
    maxHexStringLength,
    'source code did not return a valid hex string',
  )
  Logger.debug(adapterResponse)
  return adapterResponse
}

const isHexString = (result?: unknown): result is string => {
  if (typeof result !== 'string' || result.slice(0, 2) !== '0x') return false
  const hexstringRegex = /[0-9A-Fa-f]/g
  return hexstringRegex.test(result.slice(2))
}

const buildErrorResponse = (
  jobRunID: string,
  maxHexStringLength: number,
  errorString: string,
): UniversalAdapterResponse => {
  const adapterResponse = {
    jobRunID,
    statusCode: 406,
    data: {
      result: '',
    },
    result: '',
  } as UniversalAdapterResponse
  adapterResponse.errorString = errorString
  adapterResponse.data.errorString = adapterResponse.errorString
  adapterResponse.error = buildErrorHexString(adapterResponse.errorString, maxHexStringLength)
  adapterResponse.data.error = adapterResponse.error
  return adapterResponse
}

const buildErrorHexString = (
  errorString: string,
  maxHexStringResponseLength: number,
): hexstring => {
  const buf = Buffer.from(errorString)
  const shortBuf = buf.subarray(0, maxHexStringResponseLength - 2)
  return '0x' + shortBuf.toString('hex')
}
