import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import SftpClient from 'ssh2-sftp-client'
import {
  BaseEndpointTypes,
  instrumentToFileMap,
  instrumentToRemotePathMap,
  inputParameters,
} from '../endpoint/sftp'
import { CSVParserFactory } from '../parsing/factory'

const logger = makeLogger('SFTP Generic Transport')

type RequestParams = typeof inputParameters.validated

export class SftpTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  sftpClient: SftpClient
  private isConnected = false

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
      await this.disconnectFromSftp()
      throw error
    }
  }

  private async connectToSftp(): Promise<void> {
    // Check if already connected
    if (this.isConnected) {
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
      readyTimeout: 30000, // 30 second timeout for connection
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
      await this.sftpClient.connect(connectConfig)
      this.isConnected = true
      logger.debug('Successfully connected to SFTP server')
    } catch (error) {
      this.isConnected = false
      logger.error(error, 'Failed to connect to SFTP server')
      throw new AdapterInputError({
        statusCode: 500,
        message: `Failed to connect to SFTP server: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      })
    }
  }

  private async disconnectFromSftp(): Promise<void> {
    if (!this.isConnected) {
      return
    }

    try {
      await this.sftpClient.end()
      logger.debug('Disconnected from SFTP server')
    } catch (error) {
      logger.warn(error, 'Error while disconnecting from SFTP server')
    } finally {
      // Always reset connection state
      this.isConnected = false
    }
  }

  private async processFiles(param: RequestParams): Promise<any> {
    if (param.operation !== 'download') {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Unsupported operation: ${param.operation}`,
      })
    }

    if (!param.instrument) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'instrument is required for download operation',
      })
    }

    const remotePath =
      instrumentToRemotePathMap[param.instrument as keyof typeof instrumentToRemotePathMap]

    if (!remotePath) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Unsupported instrument: ${param.instrument}`,
      })
    }

    return await this.downloadFile(remotePath, param.instrument as string)
  }

  private async downloadFile(remotePath: string, instrument: string): Promise<any> {
    const maxDaysBack = 3
    let lastError: Error | null = null

    // Try downloading files starting from current date and going back up to 3 days
    for (let daysBack = 0; daysBack <= maxDaysBack; daysBack++) {
      try {
        const fullPath = this.buildFilePath(remotePath, instrument, daysBack)
        const instrumentFilePath = fullPath.split('/').pop() || 'unknown'

        if (daysBack === 0) {
          logger.info(`Downloading file: ${instrumentFilePath} from ${remotePath}`)
        } else {
          logger.info(
            `Attempting fallback: downloading file ${instrumentFilePath} (${daysBack} days back) from ${remotePath}`,
          )
        }

        const fileContent = await this.sftpClient.get(fullPath)
        if (!fileContent) {
          throw new Error(`File is empty or not found: ${instrumentFilePath}`)
        }

        const csvContent = fileContent.toString('utf8')
        logger.debug(`Downloaded file content length: ${csvContent.length} characters`)

        // Check if the content is empty after conversion to string
        if (!csvContent || csvContent.trim().length === 0) {
          throw new Error(`File is empty or not found: ${instrumentFilePath}`)
        }

        // Use the parser factory to detect the right parser based on instrument
        const parser = CSVParserFactory.detectParserByInstrument(instrument)
        if (!parser) {
          throw new AdapterInputError({
            statusCode: 400,
            message: `No suitable parser found for file: ${instrumentFilePath}`,
          })
        }

        // Parse the CSV content and return the corresponding DataObject
        const parsedData = await parser.parse(csvContent)
        logger.debug(
          `Successfully parsed ${parsedData.length} records from file: ${instrumentFilePath}`,
        )

        if (daysBack > 0) {
          logger.warn(
            `Successfully downloaded fallback file from ${daysBack} days back: ${instrumentFilePath}`,
          )
        }

        return parsedData
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (daysBack < maxDaysBack) {
          logger.debug(
            `Failed to download file for day ${daysBack}, trying ${daysBack + 1} days back: ${
              lastError.message
            }`,
          )
          continue
        }
      }
    }

    logger.error(
      lastError,
      `Failed to download file after trying ${maxDaysBack + 1} days back from ${remotePath}`,
    )
    throw new AdapterInputError({
      statusCode: 500,
      message: `Failed to download file after trying ${maxDaysBack + 1} days back: ${
        lastError?.message || 'Unknown error'
      }`,
    })
  }

  private buildFilePath(
    remotePath: string,
    instrument: string,
    additionalDaysBack = 0,
  ): string {
    const filePathTemplate = this.getInstrumentFilePath(instrument)

    const now = new Date()

    // Convert to London timezone manually - UTC+1 in summer (BST), UTC+0 in winter (GMT)
    const londonOffset = now.getMonth() >= 2 && now.getMonth() <= 9 ? 1 : 0 // BST vs GMT
    const londonTime = new Date(now.getTime() + londonOffset * 60 * 60 * 1000)

    // Check if it's before 4 PM London time (16:00)
    const isBeforeFileGeneration = londonTime.getHours() < 16

    // Start with London date
    const targetDate = new Date(londonTime)

    // Calculate total days to go back: 1 day if before 4 PM + additional days back
    const totalDaysBack = (isBeforeFileGeneration ? 1 : 0) + additionalDaysBack

    // Go back the total number of days
    targetDate.setDate(targetDate.getDate() - totalDaysBack)

    // Format day, month, and year with leading zeros
    const currentDay = targetDate.getDate().toString().padStart(2, '0')
    const currentMonth = (targetDate.getMonth() + 1).toString().padStart(2, '0') // getMonth() returns 0-11
    const currentYear = targetDate.getFullYear().toString().slice(-2) // Get last 2 digits of year

    const instrumentFilePath = filePathTemplate
      .replace('{{dd}}', currentDay)
      .replace('{{mm}}', currentMonth)
      .replace('{{yy}}', currentYear)
    return `${remotePath}/${instrumentFilePath}`.replace(/\/+/g, '/')
  }

  getInstrumentFilePath(instrument: string): string {
    const filePathTemplate = instrumentToFileMap[instrument as keyof typeof instrumentToFileMap]

    if (!filePathTemplate) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Unsupported instrument: ${instrument}`,
      })
    }
    return filePathTemplate
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  // Clean up method to close SFTP connection when transport is destroyed
  async cleanup(): Promise<void> {
    await this.disconnectFromSftp()
  }
}

export const sftpTransport = new SftpTransport()
