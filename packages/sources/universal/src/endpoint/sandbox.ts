import {
  AdapterError,
  AdapterResponse,
  Method,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { TimestampedRequestSigner } from '../utils/timestampedRequestSigner'

export const supportedEndpoints = ['sandbox']

export interface ResponseSchema {
  success?: hexstring
  error?: string
}

export const description =
  'This adapter endpoint sends a custom request to a FaaS sandbox to be executed.'

export type TInputParameters = {
  code: string
  httpQueries?: HttpQuery[]
  args?: string[]
  secrets?: string
  codeLocation?: 'onchain'
  secretsLocation?: 'onchain'
  language?: 'javascript'
}

export const inputParameters: InputParameters<TInputParameters> = {
  code: {
    description: 'JavaScript source code to be executed',
    required: true,
  },
  httpQueries: {
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

type HttpQuery = {
  HttpVerb: 'Get'
  url: string
  headers: Record<string, string>
}

// a hexstring will start with '0x'
type hexstring = string

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const httpQueries = validator.validated.data.httpQueries
  const code = validator.validated.data.code
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

  const sandboxRequestData = { httpQueries, code, secrets, args }

  const url = config.adapterSpecificParams?.sandboxURL as string
  const privateKey = config.adapterSpecificParams?.sandboxAuthPrivateKey as string

  const signer = new TimestampedRequestSigner(privateKey)
  const signedSandboxRequestData = signer.signRequestWithTimestamp(sandboxRequestData)

  const options = { url, method: 'POST' as Method, data: signedSandboxRequestData }
  const sandboxResponse = await Requester.request<ResponseSchema>(options)

  const adapterResponse = {
    jobRunID,
    statusCode: NaN,
    data: {} as { result?: hexstring; error?: string },
    providerStatusCode: sandboxResponse.status,
  }

  if (typeof sandboxResponse.data.error === 'string') {
    adapterResponse.data.error = sandboxResponse.data.error
    adapterResponse.statusCode = 400
    return adapterResponse as AdapterResponse
  }

  if (isHexString(sandboxResponse.data.success)) {
    if (
      sandboxResponse.data.success.length >
      (config.adapterSpecificParams?.maxHexStringResponseLength as number)
    ) {
      adapterResponse.data.error = `returned hex string is longer than ${config.adapterSpecificParams?.maxHexStringResponseLength} characters`
      adapterResponse.statusCode = 400
    } else {
      adapterResponse.data.result = sandboxResponse.data.success
      adapterResponse.statusCode = 200
    }
    return adapterResponse as AdapterResponse
  }

  adapterResponse.data.error = 'source code did not return a valid hex string'
  adapterResponse.statusCode = 400
  return adapterResponse as AdapterResponse
}

const isHexString = (result?: unknown): result is string => {
  if (typeof result !== 'string' || result.slice(0, 2) !== '0x') return false
  const hexstringRegex = /[0-9A-Fa-f]/g
  return hexstringRegex.test(result.slice(2))
}
