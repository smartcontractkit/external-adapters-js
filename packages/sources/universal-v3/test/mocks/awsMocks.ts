import type { AWSError, Lambda } from 'aws-sdk'
import AWS from 'aws-sdk-mock'
import { readFileSync, writeFileSync, rmSync } from 'fs'

export const mockLambdaDelete = (): void => {
  AWS.mock('Lambda', 'deleteFunction', ({ FunctionName }, callback) => {
    if (FunctionName !== '11') {
      throw Error(
        `Unexpected function requested for deletion. Expected 11, received ${FunctionName}`,
      )
    }

    let counterObj: { lambdaDeleteCounter?: number } // eslint-disable-line
    try {
      const objStr = readFileSync('./counter.json').toString()
      counterObj = JSON.parse(objStr)
      if (typeof counterObj.lambdaDeleteCounter === 'undefined') {
        counterObj = { lambdaDeleteCounter: 0 }
      }
    } catch (errorMsg) {
      counterObj = { lambdaDeleteCounter: 0 }
      writeFileSync('./counter.json', JSON.stringify(counterObj))
    }

    // Test if lambdaDelete returns error
    if (counterObj.lambdaDeleteCounter === 1) {
      rmSync('./counter.json')
      callback(undefined, {})
      return
    } else {
      counterObj.lambdaDeleteCounter = 1
      writeFileSync('./counter.json', JSON.stringify(counterObj))
      callback({
        code: 500,
        name: 'Delete error',
        message: 'error deleting function',
        time: '2022-12-10T20:28:17.849+0000',
      } as unknown as AWSError)
    }
  })
}

export const mockLambdaCreate = (): void => {
  AWS.mock('Lambda', 'createFunction', (params, callback) => {
    let counterObj: { lambdaCreateCounter?: number } // eslint-disable-line
    try {
      const objStr = readFileSync('./counter.json').toString()
      counterObj = JSON.parse(objStr)
      if (typeof counterObj.lambdaCreateCounter === 'undefined') {
        counterObj.lambdaCreateCounter = 0
      }
    } catch (errorMsg) {
      counterObj = { lambdaCreateCounter: 0 }
      writeFileSync('./counter.json', JSON.stringify(counterObj))
    }

    if (counterObj.lambdaCreateCounter === 0) {
      counterObj.lambdaCreateCounter = 1
      writeFileSync('./counter.json', JSON.stringify(counterObj))
      callback({
        code: 500,
        name: 'Create error',
        message: 'error creating function',
        time: '2022-12-10T20:28:17.849+0000',
      } as unknown as AWSError)
      return
    }

    const functionConfig = {
      FunctionName: '',
      FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:',
      Runtime: 'nodejs16.x',
      Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
      Handler: 'index.handler',
      CodeSize: 224598,
      Description: 'Universal adapter sandbox',
      Timeout: 10,
      MemorySize: 512,
      LastModified: '2022-12-10T02:12:06.925+0000',
      CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
      Version: '$LATEST',
      Environment: {
        Variables: {
          LOG_LEVEL: 'false',
        },
      },
      KMSKeyArn: null,
      TracingConfig: {
        Mode: 'PassThrough',
      },
      MasterArn: null,
      RevisionId: '04f5d2a9-1d3a-41cf-a6ad-eb2ca06f06da',
      State: 'Pending',
      StateReason: 'The function is being created.',
      StateReasonCode: 'Creating',
      LastUpdateStatus: null,
      LastUpdateStatusReason: null,
      LastUpdateStatusReasonCode: null,
      PackageType: 'Zip',
      SigningProfileVersionArn: null,
      SigningJobArn: null,
      Architectures: ['x86_64'],
      EphemeralStorage: {
        Size: 512,
      },
      SnapStart: {
        ApplyOn: 'None',
        OptimizationStatus: 'Off',
      },
    }

    functionConfig.FunctionName = params.FunctionName
    functionConfig.FunctionArn += params.FunctionName
    rmSync('./counter.json')
    callback(undefined, functionConfig as unknown as Lambda.FunctionConfiguration)
  })
}

export const mockLambdaInvoke = (): void => {
  AWS.mock('Lambda', 'invoke', (params, callback) => {
    switch (params.FunctionName) {
      case '188':
        callback(undefined, {
          StatusCode: 200,
          FunctionError: 'Unhandled',
          ExecutedVersion: '$LATEST',
          Payload:
            '{"errorType":"Runtime.ExitError","errorMessage":"RequestId: 2df5e065-a66a-4630-b488-72b17a2d092a Error: Runtime exited with error: signal: killed"}',
        })
        return
      case '185':
        callback(undefined, {
          StatusCode: 200,
          FunctionError: 'Unhandled',
          ExecutedVersion: '$LATEST',
          Payload:
            '{"errorType":"Runtime.ExitError","errorMessage":"RequestId: 2df5e065-a66a-4630-b488-72b17a2d092a Error: Runtime exited with error: signal: killed"}',
        })
        return
      case '125':
        // test retry count exceeded
        // eslint-disable-next-line
        const lambdaError = {
          message: 'unknown',
          code: 'unknown',
          time: '2022-12-10T18:12:06.492Z',
          requestId: '89791dc5-562b-45c0-ac31-08cca76d4cb7',
          statusCode: 404,
          retryable: false,
          retryDelay: 69.02328668143028,
        }
        callback(lambdaError as unknown as AWSError)
        return
      case '88':
        // eslint-disable-next-line
        const badSuccessResponseType = {
          StatusCode: 200,
          ExecutedVersion: '$LATEST',
          Payload: '{"statusCode":200,"body":"{\\"success\\":1,\\"userHttpQueries\\":[]}"}',
        }
        callback(undefined, badSuccessResponseType)
        return
      case '85':
        // eslint-disable-next-line
        const nonJsonResponsePayload = {
          StatusCode: 200,
          ExecutedVersion: '$LATEST',
          Payload:
            '{"statusCode":200,"body":"0x0000000000000000000000000000000000000000000000000000000000000001"}',
        }
        callback(undefined, nonJsonResponsePayload)
        return
      case '25':
        callback(undefined, {
          StatusCode: 200,
          FunctionError: 'Unhandled',
          ExecutedVersion: '$LATEST',
          Payload:
            '{"errorMessage":"2022-12-10T02:07:56.484Z 78f0bd90-ac11-46ff-a8dd-a57473f8c351 Task timed out after 10.01 seconds"}',
        })
        return
      case '11':
        // eslint-disable-next-line
        const nonObjectResponsePayload = {
          StatusCode: 200,
          ExecutedVersion: '$LATEST',
          Payload:
            '{"statusCode":200,"body":"\\"0x0000000000000000000000000000000000000000000000000000000000000001\\""}',
        }
        callback(undefined, nonObjectResponsePayload)
        return
      case '2':
        // eslint-disable-next-line
        const emptyPayload = {
          StatusCode: 200,
          ExecutedVersion: '$LATEST',
          Payload: '',
        }
        callback(undefined, emptyPayload)
        return
      case '1':
        if (
          params.Payload !==
          '{"source":"return OCR2DR.encodeUint256(secrets.secretNumber)","secrets":{"secretNumber":42},"args":["1"]}'
        ) {
          throw Error('Unexpected request payload')
        }

        let counterObj: { lambda1InvokeCounter?: number } // eslint-disable-line
        try {
          const objStr = readFileSync('./counter.json').toString()
          counterObj = JSON.parse(objStr)
          if (typeof counterObj.lambda1InvokeCounter === 'undefined') {
            counterObj.lambda1InvokeCounter = 0
          }
        } catch (errorMsg) {
          counterObj = { lambda1InvokeCounter: 0 }
          writeFileSync('./counter.json', JSON.stringify(counterObj))
        }

        switch (counterObj.lambda1InvokeCounter) {
          case 0:
            // eslint-disable-next-line
            const unknownError = {
              message: 'unknown',
              code: 'unknown',
              time: '2022-12-10T18:12:06.492Z',
              requestId: '89791dc5-562b-45c0-ac31-08cca76d4cb7',
              statusCode: 404,
              retryable: false,
              retryDelay: 69.02328668143028,
            }
            counterObj.lambda1InvokeCounter = 1
            writeFileSync('./counter.json', JSON.stringify(counterObj))
            callback(unknownError as unknown as AWSError)
            return
          case 1:
            // eslint-disable-next-line
            const notFoundError = {
              message:
                'Function not found: arn:aws:lambda:us-east-2:525756034769:function:universal-adapter-sandbox67',
              code: 'ResourceNotFoundException',
              time: '2022-12-10T18:12:06.492Z',
              requestId: '89791dc5-562b-45c0-ac31-08cca76d4cb7',
              statusCode: 404,
              retryable: false,
              retryDelay: 69.02328668143028,
            }
            counterObj.lambda1InvokeCounter = 2
            writeFileSync('./counter.json', JSON.stringify(counterObj))
            callback(notFoundError as unknown as AWSError)
            return
          case 2:
            // eslint-disable-next-line
            const pendingError = {
              message:
                'The operation cannot be performed at this time. The function is currently in the following state: Pending',
              code: 'ResourceConflictException',
              time: '2022-12-10T18:08:30.099Z',
              requestId: 'dce8bde5-e34b-4018-b7da-fafe372c92aa',
              statusCode: 409,
              retryable: false,
              retryDelay: 85.11585410298386,
            }
            counterObj.lambda1InvokeCounter = 3
            writeFileSync('./counter.json', JSON.stringify(counterObj))
            callback(pendingError as unknown as AWSError)
            return
          case 3:
            // eslint-disable-next-line
            const successResponse = {
              StatusCode: 200,
              ExecutedVersion: '$LATEST',
              Payload:
                '{"statusCode":200,"body":"{\\"success\\":\\"0x000000000000000000000000000000000000000000000000000000000000002a\\",\\"userHttpQueries\\":[]}"}',
            }
            rmSync('./counter.json')
            callback(undefined, successResponse)
            return
        }
        return
    }
  })
}

export const mockLambdaListFunctions = (): void => {
  AWS.mock('Lambda', 'listFunctions', (params, callback) => {
    const page0 = {
      NextMarker: 'markerForPage1',
      Functions: [
        {
          FunctionName: '25',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:25',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          LastModified: '2022-12-09T22:11:36.657+0000',
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: '1489320d-6006-4a99-8fc7-a1784afd7253',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
        {
          FunctionName: '88',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:88',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          LastModified: '2022-12-09T20:28:57.622+0000',
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: '98f6b9be-92f8-4ab4-9e76-c947fac621c7',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
        {
          FunctionName: '2',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:1',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          LastModified: '2022-12-10T01:58:06.002+0000',
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: 'a369308c-fcbc-492e-91a7-c9076c595a1d',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
        {
          FunctionName: '85',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:85',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          LastModified: '2022-12-09T20:28:17.849+0000',
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: 'b491302b-9c14-4d85-b327-933b75ca5275',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
      ],
    }

    const page1 = {
      NextMarker: 'markerForPage2',
      Functions: [
        {
          FunctionName: '125',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:125',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          LastModified: '2022-12-10T22:11:36.657+0000',
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: '1489320d-6006-4a99-8fc7-a1784afd7253',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
        {
          FunctionName: '188',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:188',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          LastModified: '2022-12-10T20:28:57.622+0000',
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: '98f6b9be-92f8-4ab4-9e76-c947fac621c7',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
        {
          FunctionName: '11',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:11',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: 'a369308c-fcbc-492e-91a7-c9076c595a1d',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
        {
          FunctionName: '185',
          FunctionArn: 'arn:aws:lambda:us-east-2:525756034769:function:185',
          Runtime: 'nodejs16.x',
          Role: 'arn:aws:iam::525756034769:role/lambda-with-logging',
          Handler: 'index.handler',
          CodeSize: 224598,
          Description: 'Universal adapter sandbox',
          Timeout: 10,
          MemorySize: 512,
          LastModified: '2022-12-10T20:28:17.849+0000',
          CodeSha256: 'LsQdtLJuQ6Lh+E6aU07i41m0voXoVHT0zWLfqwsLgz0=',
          Version: '$LATEST',
          Environment: {
            Variables: {
              LOG_LEVEL: 'false',
            },
          },
          KMSKeyArn: null,
          TracingConfig: {
            Mode: 'PassThrough',
          },
          MasterArn: null,
          RevisionId: 'b491302b-9c14-4d85-b327-933b75ca5275',
          State: null,
          StateReason: null,
          StateReasonCode: null,
          LastUpdateStatus: null,
          LastUpdateStatusReason: null,
          LastUpdateStatusReasonCode: null,
          PackageType: 'Zip',
          SigningProfileVersionArn: null,
          SigningJobArn: null,
          Architectures: ['x86_64'],
          EphemeralStorage: {
            Size: 512,
          },
          SnapStart: {
            ApplyOn: 'None',
            OptimizationStatus: 'Off',
          },
        },
      ],
    }

    const page2 = {}

    if (params.Marker === 'markerForPage2') {
      callback(undefined, page2 as unknown as Lambda.ListFunctionsResponse)
    } else if (params.Marker === 'markerForPage1') {
      callback(undefined, page1 as unknown as Lambda.ListFunctionsResponse)
    } else {
      callback(undefined, page0 as unknown as Lambda.ListFunctionsResponse)
    }
  })
}
