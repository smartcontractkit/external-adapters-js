import type { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from '../../src'
import { ResponseBuilder } from '../../src/utils/buildResponse'

const config = {
  DON_SECRETS_DECRYPTION_PRIVATE_KEY: 'dummyValue',
  AWS_ACCESS_KEY_ID: 'AKIAXU2RRA3I7RAIYSRS', // This is a dummy value
  AWS_SECRET_ACCESS_KEY: 'RxRajRWTveKOtk+fS6mX/njdESURohel4RjuMWrj', // This is a dummy value
  AWS_REGION: 'dummyValue',
  LAMBDA_SOURCE_CODE_S3_BUCKET: 'dummyValue',
  LAMBDA_SOURCE_CODE_ZIP_FILE_NAME: 'dummyValue',
  LAMBDA_ROLE_ARN: 'dummyValue',
  LAMBDA_LOG_LEVEL: 'false',
  LAMBDA_MAX_DEPLOYED_FUNCTIONS: 10,
  LAMBDA_PRUNER_LOOP_WAIT_MS: 100,
  LAMBDA_SANDBOX_TIMEOUT_MS: 10000,
  LAMBDA_FUNCTION_NAME_PREFIX: '',
  LAMBDA_RETRY_TIME_MS: 100,
  LAMBDA_RETRY_COUNT: 5,
  LAMBDA_INIT_TIME_MS: 500,
  LAMBDA_MEMORY_SIZE_MB: 512,
  MAX_RESPONSE_BYTES: 256,
} as unknown as AdapterConfig<typeof customSettings>

describe('BuildResponse', () => {
  it('builds empty error response', () => {
    const responseBuilder = new ResponseBuilder(config)

    const genericEmpytError = responseBuilder.buildGenericUserErrorResponse('')

    expect(genericEmpytError).toEqual({
      result: 'error',
      data: { result: '', error: '0x0', errorString: '' },
      statusCode: 200,
      timestamps: {
        providerDataReceived: NaN,
        providerDataRequested: NaN,
        providerIndicatedTime: NaN,
      },
    })
  })
})
