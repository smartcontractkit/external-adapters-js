import type {
  Transport,
  TransportGenerics,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import type {
  AdapterRequest,
  AdapterResponse,
  RequestGenerics,
} from '@chainlink/external-adapter-framework/util'
import type { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import type { InputParameters } from '@chainlink/external-adapter-framework/validation'
import type { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { LambdaController } from '../utils/LambdaController'
import { customSettings } from '../index'
import { decrypt } from '../utils/secretsDecrypter'
import type { SandboxOutput, Response } from '../utils/buildResponse'
import { ResponseBuilder } from '../utils/buildResponse'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters: InputParameters = {
  source: {
    description: 'JavaScript source code to be executed',
    type: 'string',
    required: true,
  },
  subscriptionId: {
    description: 'Subscription Id used by the request',
    required: true,
  },
  requestId: {
    description: 'Request Id unique to each request',
    required: true,
  },
  maxResponseBytes: {
    description: 'Maximum size of response data, in bytes',
  },
  numAllowedQueries: {
    description: 'Number of HTTP queries that can be performed in a request',
  },
  secrets: {
    description: 'Base64 bytestring representing an encrypted secrets object in base64 format',
    dependsOn: ['secretsOwner', 'subscriptionId'],
  },
  secretsOwner: {
    description: 'Owner of the encrypted secrets used for signature verification',
    dependsOn: ['secrets', 'subscriptionId'],
  },
  args: {
    description: 'Array of on-chain arguments which are passed to the source code',
    type: 'array',
  },
  codeLocation: {
    description:
      'Location of user-provided code, encoded as an integer represeting a enum (0 = on-chain)',
    type: 'number',
    options: [0],
  },
  secretsLocation: {
    description:
      'Location of user-provided secrets, encoded as an integer represeting a enum (0 = on-chain)',
    type: 'number',
    options: [0],
  },
  language: {
    description:
      'Language of the user-provided code, encoded as an integer represeting a enum (0 = javascript)',
    type: 'number',
    options: [0],
  },
}

interface Input {
  source: string
  subscriptionId: string
  requestId: string
  numAllowedQueries?: number
  maxResponseBytes?: number
  args?: string[]
  secrets?: base64bytes
  secretsOwner?: string
  codeLocation?: Location.Onchain
  secretsLocation?: Location.Onchain
  language?: Language.JavaScript
}

type base64bytes = string

enum Location {
  Onchain = 0,
}

enum Language {
  JavaScript = 0,
}

interface Request extends RequestGenerics {
  Params: Input
}

interface AdapterIO extends TransportGenerics {
  Request: Request
  Response: Response
  CustomSettings: typeof customSettings
}

interface LambdaTransport extends Transport<AdapterIO> {
  lambdaController: LambdaController
}

class Lambda implements LambdaTransport {
  lambdaController!: LambdaController

  initialize = async (
    _dependencies: TransportDependencies<AdapterIO>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<void> => {
    this.lambdaController = new LambdaController(config)
    await this.lambdaController.initalize()
    return
  }

  // This function handles each request sent to the EA
  foregroundExecute = async (
    req: AdapterRequest<Request>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AdapterResponse<Response>> => {
    const {
      requestId,
      source,
      subscriptionId,
      secrets,
      secretsOwner,
      args,
      numAllowedQueries,
      maxResponseBytes,
    } = req.requestContext.data

    const responseBuilder = new ResponseBuilder(config)

    let decryptedSecrets: Record<string, unknown> = {}
    if (secrets) {
      try {
        if (!secretsOwner) {
          throw Error('Invalid secrets owner')
        }

        decryptedSecrets = await decrypt(
          config.DON_SECRETS_DECRYPTION_PRIVATE_KEY,
          secrets,
          secretsOwner,
        )
      } catch (untypedError) {
        const error = untypedError as Error
        return responseBuilder.buildGenericUserErrorResponse(error.message)
      }
    }

    let sandboxOutput: SandboxOutput
    try {
      sandboxOutput = await this.lambdaController.executeRequestInLambda(
        `${config.LAMBDA_FUNCTION_NAME_PREFIX}${subscriptionId}`,
        {
          source,
          requestId,
          secrets: decryptedSecrets,
          args,
          numAllowedQueries,
          maxResponseBytes,
        },
        config.LAMBDA_RETRY_COUNT,
      )
    } catch (untypedError) {
      const error = untypedError as Error
      throw new AdapterError({
        statusCode: 500,
        status: 'error',
        name: 'Lambda Error',
        message: error.message,
      })
    }

    return responseBuilder.buildResponse(sandboxOutput)
  }

  // This function in the background in a loop and waits for returned number of milliseconds between each iteration
  backgroundExecute = async (): Promise<number> => {
    return await this.lambdaController.lambdaPruner()
  }

  // The response cache is not used, but is required to conform to the Transport interface
  responseCache!: ResponseCache<{
    Request: Request
    Response: Response
  }>
}

const lambdaTransport = new Lambda()

export const lambda = new AdapterEndpoint({
  name: 'lambda',
  transport: lambdaTransport,
  inputParameters,
})
