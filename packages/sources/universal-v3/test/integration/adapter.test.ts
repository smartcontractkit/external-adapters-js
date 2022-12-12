import { SuperTest, Test } from 'supertest'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import {
  mockLambdaListFunctions,
  mockLambdaInvoke,
  mockLambdaCreate,
  mockLambdaDelete,
} from '../mocks/awsMocks'

describe('execute', () => {
  const envVariables = {
    CACHE_ENABLED: 'false',
    DON_SECRETS_DECRYPTION_PRIVATE_KEY:
      '0x09768a19def4dce2b6793d7dc807828ef47b681709cf1005627a93f0da9c8065',
    AWS_ACCESS_KEY_ID: 'AKIAXU2RRA3I7RAIYSRS', // This is a dummy value
    AWS_SECRET_ACCESS_KEY: 'RxRajRWTveKOtk+fS6mX/njdESURohel4RjuMWrj', // This is a dummy value
    AWS_REGION: 'us-east-2',
    LAMBDA_SOURCE_CODE_S3_BUCKET: 'universal-adapter-sandbox-code',
    LAMBDA_SOURCE_CODE_ZIP_FILE_NAME: 'universal-adapter-sandbox.zip',
    LAMBDA_ROLE_ARN: 'arn:aws:iam::525756034769:role/lambda-with-logging',
    LAMBDA_MAX_DEPLOYED_FUNCTIONS: '8',
    LAMBDA_PRUNER_LOOP_WAIT_MS: '100',
  }

  mockLambdaListFunctions()
  mockLambdaInvoke()
  mockLambdaCreate()
  mockLambdaDelete()

  const context: SuiteContext = {
    req: null,
    server: async () => {
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  setupExternalAdapterTest(envVariables, context)

  it('should return success', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(secrets.secretNumber)',
        subscriptionId: 1,
        secrets:
          'l6f5tNWP759z5RkCJgdWhgJYTqNYx/9H2Z1RGfEf/12twpDkfuGpxgFXf0e3aF88MEFldu0nAwCjKK8a+lGr3d7eh3EEHZyKmjBgwhLHPAapRYWSATDm+bwaElX/u8uaR/6xY8Auh+ePc8TVYeaxPK1Grm5rMKL0h2FunVinL6ttnQY+jJxkxtaxwnIYMLn3fj/pVfdhmo9kR0R5ysyMdHszHWJtWAWaL69vLtBWyVcGr/AzRLNb3G0tnwLCC55mnlCit9LFuAKmkJXq2cKriGCXNQOAtUik+eWIsb/L1OFILpoumQmYNSNHtQQN2Vn3F87Lwt0d3xhiRewVqLrqRUN4mpEUMOxOXsTayfzRvX/H',
        args: ['1'],
        secretsOwner: '0x2334dE553AB93c69b0ccbe278B6f5E8350Db6204',
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'success',
      data: {
        result: '0x000000000000000000000000000000000000000000000000000000000000002a',
        error: '',
        userHttpQueries: [],
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return invalid secrets format error message', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(secrets.secretNumber)',
        subscriptionId: 1,
        secrets:
          'pvpip76tr67T007g2W9h7wLi1Q5fmUrY6ZKIJi9d6iZA/f7YJtZQdKkId74kk3omGPcrYuzLkE9oPXepsklBh981GnPBYBok95hNfII4/CdxovTGlw4Dk7NiffePxQn26BfKbeV0JfnvDHM1JmJbYFQNLqRb+tCfBvBmbmMXcCIHeyuXAMz2Sos5zB1c6cwUDk6iOJBKyoYqQa4dPJ0IDS/NQi24tqKs0oE63rx+068Lqa3aWKHoqCWwr/5EdqSP3iGCW4bGIQYhQkAjgC8pE2GKLWNxbvS0/hTJcDHSEO3biJPh76bGvYdl5wANgmXYoma4NQMk7Nf0a9ltIzVBybq8Q3wXuekTaKIJPJfUr5cc',
        args: ['1'],
        secretsOwner: '0x2334dE553AB93c69b0ccbe278B6f5E8350Db6204',
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error: '0x496e76616c6964204a534f4e20666f726d617420666f722073656372657473',
        errorString: 'Invalid JSON format for secrets',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return secrets not signed by owner error message', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(secrets.secretNumber)',
        subscriptionId: 1,
        secrets:
          'l6f5tNWP759z5RkCJgdWhgJYTqNYx/9H2Z1RGfEf/12twpDkfuGpxgFXf0e3aF88MEFldu0nAwCjKK8a+lGr3d7eh3EEHZyKmjBgwhLHPAapRYWSATDm+bwaElX/u8uaR/6xY8Auh+ePc8TVYeaxPK1Grm5rMKL0h2FunVinL6ttnQY+jJxkxtaxwnIYMLn3fj/pVfdhmo9kR0R5ysyMdHszHWJtWAWaL69vLtBWyVcGr/AzRLNb3G0tnwLCC55mnlCit9LFuAKmkJXq2cKriGCXNQOAtUik+eWIsb/L1OFILpoumQmYNSNHtQQN2Vn3F87Lwt0d3xhiRewVqLrqRUN4mpEUMOxOXsTayfzRvX/H',
        args: ['1'],
        secretsOwner: '0xBc0931940C9d40b898057F07D5B9907204Cb75F0',
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error: '0x53656372657473206e6f74207369676e656420627920737562736372697074696f6e206f776e6572',
        errorString: 'Secrets not signed by subscription owner',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return invalid secrets error message', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(secrets.secretNumber)',
        subscriptionId: 1,
        secretsOwner: '0x2334dE553AB93c69b0ccbe278B6f5E8350Db6204',
        secrets:
          'f5tNWP759z5RkCJgdWhgJYTqNYx/9H2Z1RGfEf/12twpDkfuGpxgFXf0e3aF88MEFldu0nAwCjKK8a+lGr3d7eh3EEHZyKmjBgwhLHPAapRYWSATDm+bwaElX/u8uaR/6xY8Auh+ePc8TVYePK1Grm5rMKL0h2FunVinL6ttnQY+jJxkxtaxwnIYMLn3fj/pVfdhmo9kR0R5ysyMdHszHWJtWAWaL69vLtBWyVcGr/AzRLNb3G0tnwLCC55mnlCit9LFuAKmkJXq2cKriGCXNQOAtUik+eWIsb/L1OFILpoumQmYNSNHtQQN2Vn3F87Lwt0d3xhiRewVqLrqRUN4mpEUMOxOTayfzRvX/H',
        args: ['1'],
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error: '0x456e6372797074656420736563726574732061726520696e76616c6964',
        errorString: 'Encrypted secrets are invalid',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return no secrets owner error message', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(secrets.secretNumber)',
        subscriptionId: 1,
        secrets:
          'l6f5tNWP759z5RkCJgdWhgJYTqNYx/9H2Z1RGfEf/12twpDkfuGpxgFXf0e3aF88MEFldu0nAwCjKK8a+lGr3d7eh3EEHZyKmjBgwhLHPAapRYWSATDm+bwaElX/u8uaR/6xY8Auh+ePc8TVYeaxPK1Grm5rMKL0h2FunVinL6ttnQY+jJxkxtaxwnIYMLn3fj/pVfdhmo9kR0R5ysyMdHszHWJtWAWaL69vLtBWyVcGr/AzRLNb3G0tnwLCC55mnlCit9LFuAKmkJXq2cKriGCXNQOAtUik+eWIsb/L1OFILpoumQmYNSNHtQQN2Vn3F87Lwt0d3xhiRewVqLrqRUN4mpEUMOxOXsTayfzRvX/H',
        args: ['1'],
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error: '0x496e76616c69642073656372657473206f776e6572',
        errorString: 'Invalid secrets owner',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return timeout exceeded error message', async () => {
    const requestPayload = {
      data: {
        source: 'await new Promise(r => setTimeout(() => r(), 30000))',
        subscriptionId: 25,
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error:
          '0x54696d656f7574204572726f723a204a61766153637269707420657865637574696f6e2074696d65206578636565646564',
        errorString: 'Timeout Error: JavaScript execution time exceeded',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return RAM exceeded error message', async () => {
    const requestPayload = {
      data: {
        source: 'const a = [];for (let i = 0; i < 9000000000; i++) {a.push(i);};',
        subscriptionId: 185,
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error:
          '0x52756e74696d65204572726f723a204a61766153637269707420657865637574696f6e206661696c65642e20436865636b2052414d2075736167652e',
        errorString: 'Runtime Error: JavaScript execution failed. Check RAM usage.',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should throw Lambda retries exceeded error', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(1)',
        subscriptionId: 125,
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(500)
    expect(response.body).toEqual({
      status: 'error',
      statusCode: 500,
      error: { name: 'Lambda Error', message: 'unknown' },
    })
  })

  it('should return error message if success response is not a string', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(1)',
        subscriptionId: 88,
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error: '0x496e76616c6964206f75747075742066726f6d20736f7572636520636f6465',
        errorString: 'Invalid output from source code',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return error message if response payload is not in JSON format', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(1)',
        subscriptionId: 85,
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error: '0x496e76616c6964206f75747075742066726f6d20736f7572636520636f6465',
        errorString: 'Invalid output from source code',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return error message if response payload is not an object', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(1)',
        subscriptionId: 11,
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error: '0x496e76616c6964206f75747075742066726f6d20736f7572636520636f6465',
        errorString: 'Invalid output from source code',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })

  it('should return error message for empty payload', async () => {
    const requestPayload = {
      data: {
        source: 'return OCR2DR.encodeUint256(1)',
        subscriptionId: 2,
      },
    }

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(requestPayload)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toEqual({
      result: 'error',
      data: {
        result: '',
        error:
          '0x53616e64626f78204572726f723a20496e76616c6964206f75747075742066726f6d20736f7572636520636f64652e',
        errorString: 'Sandbox Error: Invalid output from source code.',
      },
      statusCode: 200,
      timestamps: {
        providerDataReceived: null,
        providerDataRequested: null,
        providerIndicatedTime: null,
      },
    })
  })
})
