import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import SftpClient from 'ssh2-sftp-client'
import { BaseEndpointTypes, inputParameters } from '../endpoint/sftp'

const logger = makeLogger('SFTP Generic Transport')

type RequestParams = typeof inputParameters.validated

export class SftpTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  sftpClient: SftpClient
  private isConnected: boolean = false

  constructor() {
    super()
    this.sftpClient = new SftpClient()
  }

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.endpointName = endpointName

    if (!adapterSettings.SFTP_HOST) {
      logger.warn('Environment variable SFTP_HOST is missing')
    }
    if (!adapterSettings.SFTP_USERNAME) {
      logger.warn('Environment variable SFTP_USERNAME is missing')
    }
    if (!adapterSettings.SFTP_PASSWORD) {
      logger.warn('SFTP_PASSWORD must be provided')
    }
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(_context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    console.log('_handleRequest called with params:', param)
    const providerDataRequestedUnixMs = Date.now()
    
    try {
      // Connect to SFTP server (will reuse existing connection if available)
      await this.connectToSftp()

      // Process files based on the request parameters
      const result = await this.processFiles(param)

      return {
        data: {
          result,
        },
        statusCode: 200,
        result,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } catch (error) {
      // Only disconnect on error to allow connection reuse
      console.log('Error in _handleRequest, disconnecting:', error)
      await this.disconnectFromSftp()
      throw error
    }
    // Remove the finally block to keep connection alive for reuse
  }

  private async connectToSftp(): Promise<void> {
    console.log('connectToSftp called, checking connection status...')
    
    // Check if already connected
    if (this.isConnected) {
      console.log('Already connected to SFTP server, skipping connection')
      return
    }

    if (!this.config.SFTP_HOST) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'Environment variable SFTP_HOST is missing',
      })
    }

    const connectConfig: any = {
      host: this.config.SFTP_HOST,
      port: this.config.SFTP_PORT || 22,
      username: this.config.SFTP_USERNAME,
    }

    // Use either password or private key authentication
    if (this.config.SFTP_PASSWORD) {
      connectConfig.password = this.config.SFTP_PASSWORD
    } else {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'SFTP_PASSWORD must be provided',
      })
    }

    try {
      console.log('Connecting to SFTP server with config:', connectConfig)
      
      // Add a timeout wrapper around the connection
      const connectPromise = this.sftpClient.connect(connectConfig)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
      })
      
      console.log('Starting connection attempt...')
      await Promise.race([connectPromise, timeoutPromise])
      console.log('Connection attempt completed')
      this.isConnected = true
      logger.debug('Successfully connected to SFTP server')
    } catch (error) {
      console.log('Connection failed with error:', error)
      this.isConnected = false
      logger.error(error, 'Failed to connect to SFTP server')
      throw new AdapterInputError({
        statusCode: 500,
        message: `Failed to connect to SFTP server: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  private async disconnectFromSftp(): Promise<void> {
    try {
      await this.sftpClient.end()
      this.isConnected = false
      logger.debug('Disconnected from SFTP server')
    } catch (error) {
      this.isConnected = false
      logger.warn(error, 'Error while disconnecting from SFTP server')
    }
  }

  private async processFiles(param: RequestParams): Promise<string> {
    if (param.operation === 'download') {
      if (!param.fileName) {
        throw new AdapterInputError({
          statusCode: 400,
          message: 'fileName is required for download operation',
        })
      }
      return await this.downloadFile(param.remotePath || '/', param.fileName)
    } else {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Unsupported operation: ${param.operation}`,
      })
    }
  }

  private async downloadFile(remotePath: string, fileName: string): Promise<string> {
    try {
      const fullPath = `${remotePath}/${fileName}`.replace(/\/+/g, '/')
      console.log('Attempting to download file from SFTP:', fullPath)
      const fileContent = await this.sftpClient.get(fullPath)
      if (!fileContent) {
        throw new AdapterInputError({
          statusCode: 404,
          message: `File is empty or not found: ${fileName}`,
        })
      }
      const result = {
        operation: 'download',
        fileName,
        path: remotePath,
        content: fileContent.toString('utf8'), // Convert to UTF-8 text for CSV files
        contentType: 'text/csv',  
      
        timestamp: Date.now(),
      }

      console.log('File downloaded successfully:', result)
      return JSON.stringify(result)
    } catch (error) {
      logger.error(error, `Failed to download file: ${fileName} from ${remotePath}`)
      throw new AdapterInputError({
        statusCode: 500,
        message: `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  // Clean up method to close SFTP connection when transport is destroyed
  async cleanup(): Promise<void> {
    console.log('Cleaning up SFTP transport...')
    await this.disconnectFromSftp()
  }
}

export const sftpTransport = new SftpTransport()
