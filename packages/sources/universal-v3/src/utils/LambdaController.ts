import AWS, { Lambda } from 'aws-sdk'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import type { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from '..'
import type { SandboxOutput } from './buildResponse'

interface SandboxRequestData {
  source: string
  requestId: string
  secrets: Record<string, unknown>
  args?: string[]
  numAllowedQueries?: number
  maxResponseBytes?: number
}

type TimeLastUsed = number

interface DeployedLambdaFunctions {
  timeLastUsed: Record<string, TimeLastUsed>
  count: number
}

export class LambdaController {
  private deployedLambdaFunctions?: DeployedLambdaFunctions
  private initalized = false
  private lambda: AWS.Lambda
  private logger = makeLogger('LambdaController')

  constructor(private config: AdapterConfig<typeof customSettings>) {
    this.lambda = new AWS.Lambda({ apiVersion: '2015-03-31' })
  }

  public initalize = async (): Promise<void> => {
    if (this.initalized) {
      throw Error('LambdaController already initalized')
    }
    AWS.config.update({
      region: process.env['AWS_REGION'] as string,
      credentials: {
        accessKeyId: this.config.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
      },
    })
    this.deployedLambdaFunctions = await this.getDeployedLambdaFunctions()
    this.logger.debug(`Deployed Lambda functions: ${Object.keys(this.deployedLambdaFunctions)}`)
    this.initalized = true
  }

  // This background tasks monitors all deployed Lambda functions.
  // It is used by the backgroundExecuter of the EAv3 framework
  // When LAMBDA_MAX_DEPLOYED_FUNCTIONS is reached, the least recently used function will be deleted
  public lambdaPruner = async (): Promise<number> => {
    if (!this.deployedLambdaFunctions) {
      throw Error('LambdaController class not initalized')
    }

    if (this.deployedLambdaFunctions.count < this.config.LAMBDA_MAX_DEPLOYED_FUNCTIONS) {
      return this.config.LAMBDA_PRUNER_LOOP_WAIT_MS
    }

    const leastRecentlyUsedFunction = await this.getLeastRecentlyUsedFunction()

    try {
      await this.deleteLambdaFunction(leastRecentlyUsedFunction)
    } catch (error) {
      this.logger.error(error as Error)
      return 1
    }

    delete this.deployedLambdaFunctions.timeLastUsed[leastRecentlyUsedFunction]
    this.deployedLambdaFunctions.count--
    return 1
  }

  public executeRequestInLambda = (
    FunctionName: string,
    sandboxRequestData: SandboxRequestData,
    retryCount: number,
  ): Promise<SandboxOutput> => {
    if (!this.deployedLambdaFunctions) {
      throw Error('LambdaController not initalized')
    }

    const invokeRequest: Lambda.InvocationRequest = {
      FunctionName,
      Payload: JSON.stringify(sandboxRequestData),
    }

    return new Promise((resolve, reject) => {
      this.lambda.invoke(invokeRequest, (err, data) => {
        this.logger.trace(`Invoking Lambda function name ${FunctionName}`)

        if (err) {
          this.handleLambdaErrorResponse(
            err,
            retryCount,
            FunctionName,
            sandboxRequestData,
            resolve,
            reject,
          )
          return
        }

        this.handleLambdaResponse(data, resolve, reject)
      })
    })
  }

  private handleLambdaResponse = (
    data: Lambda.InvocationResponse,
    resolve: (value: SandboxOutput | PromiseLike<SandboxOutput>) => void,
    reject: (reason?: unknown) => void,
  ): void => {
    this.logger.debug(`Lambda response: ${JSON.stringify(data)}`)

    const lambdaResponse = JSON.parse(data.Payload as unknown as string)

    if (!lambdaResponse.errorMessage) {
      resolve(JSON.parse(lambdaResponse.body))
      return
    }

    if (
      (lambdaResponse.errorMessage as string).includes('Runtime exited with error: signal: killed')
    ) {
      resolve({
        error: {
          name: 'Runtime Error',
          message: 'JavaScript execution failed. Check RAM usage.',
        },
      })
      return
    }

    if ((lambdaResponse.errorMessage as string).includes('Task timed out')) {
      resolve({
        error: {
          name: 'Timeout Error',
          message: 'JavaScript execution time exceeded',
        },
      })
      return
    }

    this.logger.error(`Unexpected Lambda response: ${lambdaResponse.errorMessage}`)
    reject(lambdaResponse.errorMessage)
  }

  private handleLambdaErrorResponse = (
    err: AWS.AWSError,
    retryCount: number,
    FunctionName: string,
    sandboxRequestData: SandboxRequestData,
    resolve: (value: SandboxOutput | PromiseLike<SandboxOutput>) => void,
    reject: (reason?: unknown) => void,
  ): void => {
    this.logger.trace(`Lambda error: ${err}`)
    switch (err.code) {
      // Function created, but still being initalized
      case 'ResourceConflictException':
        this.retryLambdaExecution(
          FunctionName,
          sandboxRequestData,
          retryCount,
          resolve,
          reject,
          err,
        )
        return
      // Function not yet created for subscriptionId
      case 'ResourceNotFoundException':
        resolve(this.createLambdaAndExecute(FunctionName, sandboxRequestData, retryCount))
        return
      // Unknown error
      default:
        this.logger.error(`Unexpected Lambda error: ${err}`)
        this.retryLambdaExecution(
          FunctionName,
          sandboxRequestData,
          retryCount,
          resolve,
          reject,
          err,
        )
        return
    }
  }

  private retryLambdaExecution = (
    FunctionName: string,
    sandboxRequestData: SandboxRequestData,
    retryCount: number,
    resolve: (value: SandboxOutput | PromiseLike<SandboxOutput>) => void,
    reject: (reason?: unknown) => void,
    err: AWS.AWSError,
  ): void => {
    if (retryCount <= 0) {
      this.logger.error(`Lambda retry count exceeded`)
      reject(err)
      return
    }

    // Retry after LAMBDA_RETRY_TIME_MS
    setTimeout(
      () => resolve(this.executeRequestInLambda(FunctionName, sandboxRequestData, retryCount--)),
      this.config.LAMBDA_RETRY_TIME_MS,
    )
  }

  private createLambdaAndExecute = (
    FunctionName: string,
    sandboxRequestData: SandboxRequestData,
    retryCount: number,
  ): Promise<SandboxOutput> => {
    this.logger.trace(`Creating new Lambda function with name ${FunctionName}`)

    const params: Lambda.CreateFunctionRequest = {
      Code: {
        S3Bucket: this.config.LAMBDA_SOURCE_CODE_S3_BUCKET,
        S3Key: this.config.LAMBDA_SOURCE_CODE_ZIP_FILE_NAME,
      },
      FunctionName,
      Handler: 'index.handler',
      Role: this.config.LAMBDA_ROLE_ARN,
      Runtime: 'nodejs16.x',
      Description: 'Universal adapter sandbox',
      Timeout: Math.round(this.config.LAMBDA_SANDBOX_TIMEOUT_MS / 1000),
      MemorySize: this.config.LAMBDA_MEMORY_SIZE_MB,
      Environment: {
        Variables: {
          LOG_LEVEL: this.config.LAMBDA_LOG_LEVEL,
        },
      },
      // VpcConfig: // This setting allows for putting the Lambda behind a VPC
    }

    return new Promise((resolve, reject) => {
      this.lambda.createFunction(params, (err, data) => {
        if (err) {
          this.handleLambdaErrorResponse(
            err,
            retryCount,
            FunctionName,
            sandboxRequestData,
            resolve,
            reject,
          )
          return
        }

        this.logger.debug(`Lambda creation response: ${JSON.stringify(data)}`)

        // Disabling no-non-null-assert since executeRequestInLambda already ensures initalization
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        this.deployedLambdaFunctions!.timeLastUsed[FunctionName] = Date.now()
        this.deployedLambdaFunctions!.count++
        /* eslint-enable @typescript-eslint/no-non-null-assertion */

        setTimeout(
          () => resolve(this.executeRequestInLambda(FunctionName, sandboxRequestData, retryCount)),
          this.config.LAMBDA_INIT_TIME_MS,
        )
      })
    })
  }

  // This recursive function returns all deployed Lambda functions as a Record from the name to
  // the time the function was last used.  The TimeLastUsed is initally set to zero.
  // Documentation on lambda.listFunctions: https://docs.aws.amazon.com/lambda/latest/dg/API_ListFunctions.html
  private getDeployedLambdaFunctions = async (
    Marker?: string,
  ): Promise<DeployedLambdaFunctions> => {
    return new Promise((resolve) => {
      this.lambda.listFunctions({ Marker }, async (err, data) => {
        if (err) {
          this.logger.error(`Unexpected Lambda listFunctions error: ${err}`)
          throw Error('Error fetching list of deployed Lambda functions')
        }

        const functions = data.Functions

        if (!functions) {
          resolve({ count: 0, timeLastUsed: {} })
          return
        }

        let deployedLambdaFunctions: DeployedLambdaFunctions = { count: 0, timeLastUsed: {} }

        // Each call to getDeployedLambdaFunctions fetches up to 50 Lambda functions at a time.
        // If more than 50 Lambda functions exist, the next page must be fetched using the NextMarker.
        if (data.NextMarker) {
          deployedLambdaFunctions = await this.getDeployedLambdaFunctions(data.NextMarker)
        }

        functions.forEach(({ FunctionName }) => {
          if (FunctionName) deployedLambdaFunctions.timeLastUsed[FunctionName] = 0
        })

        deployedLambdaFunctions.count = Object.keys(deployedLambdaFunctions.timeLastUsed).length

        resolve(deployedLambdaFunctions)
      })
    })
  }

  private getLeastRecentlyUsedFunction = async (): Promise<string> => {
    if (!this.deployedLambdaFunctions) {
      throw Error('LambdaController class not initalized')
    }

    let oldestTime: number | undefined
    let oldestFunction = ''

    for (const functionName in this.deployedLambdaFunctions.timeLastUsed) {
      if (typeof oldestTime === 'undefined') {
        oldestFunction = functionName
        oldestTime = this.deployedLambdaFunctions.timeLastUsed[functionName]
        continue
      }

      if (this.deployedLambdaFunctions.timeLastUsed[functionName] < oldestTime) {
        oldestFunction = functionName
        oldestTime = this.deployedLambdaFunctions.timeLastUsed[functionName]
      }
    }

    return oldestFunction
  }

  private deleteLambdaFunction = async (FunctionName: string) => {
    return new Promise((resolve, reject) => {
      this.lambda.deleteFunction({ FunctionName }, (err) => {
        if (err) {
          reject(`Error deleting Lambda function ${FunctionName}: ${err}`)
          return
        }

        this.logger.debug(`Successfully deleted Lambda function ${FunctionName}`)
        resolve('successful delete')
      })
    })
  }
}
