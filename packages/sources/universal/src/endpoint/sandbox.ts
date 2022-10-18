import {
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

export const description =
  'This adapter endpoint sends a custom request to a FaaS sandbox to be executed.'

export type TInputParameters = {
  source: string
  queries?: HttpQuery[]
  args?: string[]
  secrets?: string
  codeLocation?: Location.Onchain
  secretsLocation?: Location.Onchain
  language?: Language.JavaScript
}

enum Location {
  Onchain = 0,
}

enum Language {
  JavaScript = 0,
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
    description:
      'Location of user-provided code, encoded as an integer represeting a enum (0 = on-chain)',
  },
  secretsLocation: {
    description:
      'Location of user-provided secrets, encoded as an integer represeting a enum (0 = on-chain)',
  },
  language: {
    description:
      'Language of the user-provided code, encoded as an integer represeting a enum (0 = javascript)',
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
  const requestStartTime = Date.now()

  Logger.debug({ requestStartTime, input: { request } })

  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const queries = validator.validated.data.queries
  const source = validator.validated.data.source
  const secrets = validator.validated.data.secrets
  const args = validator.validated.data.args

  const buildErrorResponse = buildErrorResponseFactory(
    jobRunID,
    config.adapterSpecificParams?.maxHexStringLength as number,
  )

  if (validator.validated.data.codeLocation && validator.validated.data.codeLocation !== 0)
    return buildErrorResponse('invalid value for codeLocation') as unknown as AdapterResponse

  if (validator.validated.data.secretsLocation && validator.validated.data.secretsLocation !== 0)
    return buildErrorResponse('invalid value for secretsLocation') as unknown as AdapterResponse

  if (validator.validated.data.language && validator.validated.data.language !== 0)
    return buildErrorResponse('invalid value for language') as unknown as AdapterResponse

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

  const sandboxResponse = await Requester.request<SandboxResponse>(options)

  const adapterResponse = buildAdapterResponse(
    jobRunID,
    config.adapterSpecificParams?.maxHexStringLength as number,
    buildErrorResponse,
    sandboxResponse,
  ) as unknown as AdapterResponse
  Logger.debug({
    requestStartTime,
    requestDuration: Date.now() - requestStartTime,
    response: adapterResponse,
  })
  return adapterResponse
}

const buildAdapterResponse = (
  jobRunID: string,
  maxHexStringLength: number,
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
    if (sandboxResponse.data.success.length > maxHexStringLength) {
      const adapterResponse = buildErrorResponse(
        `returned hex string is longer than ${maxHexStringLength} characters`,
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

const buildErrorResponseFactory = (jobRunID: string, maxHexStringLength: number) => {
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
    adapterResponse.error = buildErrorHexString(adapterResponse.errorString, maxHexStringLength)
    adapterResponse.data.error = adapterResponse.error
    return adapterResponse
  }
}

const buildErrorHexString = (
  errorString: string,
  maxHexStringResponseLength: number,
): hexstring => {
  const buf = Buffer.from(errorString)
  const shortBuf = buf.subarray(0, maxHexStringResponseLength - 2)
  return '0x' + shortBuf.toString('hex')
}
