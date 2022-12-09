import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { expose } from '@chainlink/external-adapter-framework'
import { lambda } from './endpoint'

export const customSettings = {
  DON_SECRETS_DECRYPTION_PRIVATE_KEY: {
    type: 'string',
    description: 'Private key shared by all DON nodes used to decrypt user provided secrets',
    required: true,
    sensitive: true,
  },
  AWS_ACCESS_KEY_ID: {
    type: 'string',
    description:
      'AWS access key for the AWS user account authorized to create and invoke Lambda functions',
    required: true,
    sensitive: true,
  },
  AWS_SECRET_ACCESS_KEY: {
    type: 'string',
    description:
      'AWS secret access key for the AWS user account authorized to create and invoke Lambda functions',
    required: true,
    sensitive: true,
  },
  AWS_REGION: {
    type: 'string',
    description: 'AWS region to use for creating and invoking Lambda functions',
    required: true,
    sensitive: true,
  },
  LAMBDA_SOURCE_CODE_S3_BUCKET: {
    type: 'string',
    description:
      'Name of the S3 bucket which holds the generic sandbox source code running within the Lambda function',
    required: true,
    sensitive: true,
  },
  LAMBDA_SOURCE_CODE_ZIP_FILE_NAME: {
    type: 'string',
    description: 'Name of the ZIP file which contains the sandbox source code within the S3 bucket',
    sensitive: true,
    required: true,
  },
  LAMBDA_ROLE_ARN: {
    type: 'string',
    description: 'Role ARN of the role assigned to a Lambda function when it is being deployed',
    required: true,
    sensitive: true,
  },
  LAMBDA_LOG_LEVEL: {
    type: 'enum',
    description: 'The log level of a deployed Lambda function (options: trace, debug, info, false)',
    options: ['trace', 'debug', 'info', 'false'],
    default: 'false',
  },
  LAMBDA_MAX_DEPLOYED_FUNCTIONS: {
    type: 'number',
    description:
      'The maximum number of Lambda functions which can be deployed before the least-recently-used function is deleted',
    default: 1000,
  },
  LAMBDA_PRUNER_LOOP_WAIT_MS: {
    type: 'number',
    description:
      'Number of milliseconds to wait between each loop iteration which checks if LAMBDA_MAX_DEPLOYED_FUNCTIONS is exceeded',
    default: 5000,
  },
  LAMBDA_SANDBOX_TIMEOUT_MS: {
    type: 'number',
    description: 'Maximum duration of a request in milliseconds',
    default: 10000,
  },
  LAMBDA_FUNCTION_NAME_PREFIX: {
    type: 'string',
    description: 'Prefix prepended to the subscription ID to generate the Lambda function names',
    default: '',
  },
  LAMBDA_RETRY_TIME_MS: {
    type: 'number',
    description:
      'Number of milliseconds to retry communicating with a Lambda function after a failed invokation',
    default: 100,
  },
  LAMBDA_RETRY_COUNT: {
    type: 'number',
    description:
      'Number of times to retry communicating with a Lambda function after a failed invokation',
    default: 5,
  },
  LAMBDA_INIT_TIME_MS: {
    type: 'number',
    description:
      'Number of milliseconds to wait before trying to invoke a Lambda function after it is created',
    default: 500,
  },
  LAMBDA_MEMORY_SIZE_MB: {
    type: 'number',
    description: 'The maximum amount of RAM that can be used by a Lambda function',
    default: 512,
  },
  MAX_RESPONSE_BYTES: {
    type: 'number',
    description: 'Maximum number of bytes that can be returned by a request',
    default: 256,
  },
} as const

export const adapter = new Adapter({
  defaultEndpoint: 'lambda',
  name: 'UNIVERSAL',
  endpoints: [lambda],
  customSettings: customSettings,
})

export const server = () => expose(adapter)
