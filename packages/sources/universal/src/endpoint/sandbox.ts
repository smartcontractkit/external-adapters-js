import {
  AdapterResponse,
  AxiosResponse,
  Method,
  Requester,
  Validator,
  Logger,
  Config,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import { TimestampedRequestSigner } from '../utils/timestampedRequestSigner'
import { buildAdapterResponse, buildErrorResponseFactory } from '../utils/buildResponse'
import type { Base64ByteString } from '../utils/secretsDecrypter'
import { decrypt } from '../utils/secretsDecrypter'

export const supportedEndpoints = ['sandbox']

export const description =
  'This adapter endpoint sends a custom request to a FaaS sandbox to be executed.'

export type TInputParameters = {
  source: string
  queries?: HttpQuery[]
  args?: string[]
  secrets?: Base64ByteString
  secretsOwner?: string
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

type HttpQuery = {
  HttpVerb: 'Get'
  url: string
  headers: Record<string, string>
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
    description: 'Bytes string representing an encrypted secrets object in base64 format',
  },
  secretsOwner: {
    description: 'Owner of the encrypted secrets used for signature verification',
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

export type SandboxResponse = {
  success?: string
  error?: {
    name: string
    message: string
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const requestStartTime = Date.now()

  Logger.debug({ requestStartTime, input: { request } })

  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const queries = validator.validated.data.queries
  const source = validator.validated.data.source
  const secrets = validator.validated.data.secrets
  const secretsOwner = validator.validated.data.secretsOwner
  const args = validator.validated.data.args

  const buildErrorResponse = buildErrorResponseFactory(
    jobRunID,
    config.adapterSpecificParams?.maxResponseBytes as number,
  )

  if (validator.validated.data.codeLocation && validator.validated.data.codeLocation !== 0)
    return buildErrorResponse('invalid value for codeLocation') as unknown as AdapterResponse

  if (validator.validated.data.secretsLocation && validator.validated.data.secretsLocation !== 0)
    return buildErrorResponse('invalid value for secretsLocation') as unknown as AdapterResponse

  if (validator.validated.data.language && validator.validated.data.language !== 0)
    return buildErrorResponse('invalid value for language') as unknown as AdapterResponse

  let decryptedSecrets: Record<string, unknown> = {}

  if (secrets) {
    try {
      decryptedSecrets = await decrypt(
        config.adapterSpecificParams?.secretsDecryptionPrivateKey as string,
        secrets,
        secretsOwner,
      )
    } catch (untypedError) {
      const error = untypedError as Error
      return buildErrorResponse(error.message) as unknown as AdapterResponse
    }
  }

  const sandboxRequestData = { queries, source, secrets: decryptedSecrets, args }

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

  let sandboxResponse: AxiosResponse<SandboxResponse>
  try {
    sandboxResponse = await Requester.request<SandboxResponse>(options)
  } catch (untypedError) {
    const error = untypedError as Error
    if (error.name == 'Data Provider Request Timeout error') {
      return buildErrorResponse('computation duration exceeded') as unknown as AdapterResponse
    }
    throw error
  }

  const adapterResponse = buildAdapterResponse(
    jobRunID,
    config.adapterSpecificParams?.maxResponseBytes as number,
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
