import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import SftpClient from 'ssh2-sftp-client'
import { BaseEndpointTypes, inputParameters, instructionToDateTemplateMap } from '../endpoint/sftp'
import { CSVParserFactory } from '../parsing/factory'

const logger = makeLogger('FTSE SFTP Adapter')

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
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
      // Only disconnect on error to allow connection reuse
      await this.disconnectFromSftp()

      if (e instanceof AdapterInputError) {
        logger.error(e, e.message)
        throw e
      }

      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)

      throw new AdapterInputError({
        statusCode: 502,
        message: errorMessage,
      })
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    // Connect to SFTP server (will reuse existing connection if available)
    await this.connectToSftp()

    // Process files based on the request parameters
    const result = await this.downloadFile(param.filePath, param.instrument as string)

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
  }

  private async connectToSftp(): Promise<void> {
    // Check if already connected
    if (this.isConnected) {
      return
    }

    const connectConfig: any = {
      host: this.config.SFTP_HOST,
      port: this.config.SFTP_PORT || 22,
      username: this.config.SFTP_USERNAME,
      password: this.config.SFTP_PASSWORD,
      readyTimeout: 30000,
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
      logger.error(error, 'Error while disconnecting from SFTP server')
    } finally {
      // Always reset connection state
      this.isConnected = false
    }
  }

  private async downloadFile(remotePath: string, instrument: string): Promise<any> {
    // Files are uploaded once daily at a random time after 4 PM London time
    // We want to ensure we get the latest file, so we try up to 4 days back
    // 4 days max because of possible scenario of: Lagging day + 3 day long weekend
    const MAX_DAYS_BACK = 4
    let lastError: Error | null = null

    for (let daysBack = 0; daysBack <= MAX_DAYS_BACK; daysBack++) {
      try {
        const parsedData = await this.tryDownloadAndParseFile(remotePath, instrument, daysBack)
        logger.info(`Successfully downloaded and parsed file from path ${remotePath}`)
        return parsedData
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (daysBack < MAX_DAYS_BACK) {
          logger.error(
            `Failed to download file for day ${daysBack}, trying ${daysBack + 1} days back: ${
              error.message
            }`,
          )
        }
      }
    }

    // All attempts failed
    throw new AdapterInputError({
      statusCode: 500,
      message: `Failed to download file after trying ${MAX_DAYS_BACK + 1} days back: ${
        lastError?.message || 'Unknown error'
      }`,
    })
  }

  private async tryDownloadAndParseFile(
    remotePath: string,
    instrument: string,
    daysBack: number,
  ): Promise<any> {
    const fullPath = this.buildFilePath(remotePath, instrument, daysBack)

    // Log the download attempt
    logger.info(`Downloading file: ${fullPath} | (${daysBack} days back)`)

    const fileContent = await this.sftpClient.get(fullPath)
    // we need latin1 here because the file contains special characters like "®"
    const csvContent = fileContent.toString('latin1')

    const parser = CSVParserFactory.detectParserByInstrument(instrument)
    if (!parser) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `No suitable parser found for file: ${fullPath} and instrument: ${instrument}`,
      })
    }

    return await parser.parse(csvContent)
  }

  private buildFilePath(remotePath: string, instrument: string, additionalDaysBack = 0): string {
    // The remotePath will look like /sub_dir/sub_dir/file_suffix
    const filePathTemplate = `${remotePath}${this.getInstrumentFilePathDateTemplate(instrument)}`

    const now = new Date()

    // Convert to London timezone using proper timezone handling
    // Create a date formatter for London timezone
    const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))

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
    return instrumentFilePath
  }

  getInstrumentFilePathDateTemplate(instrument: string): string {
    const filePathTemplate =
      instructionToDateTemplateMap[instrument as keyof typeof instructionToDateTemplateMap]

    if (!filePathTemplate) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Unsupported instrument: ${instrument}`,
      })
    }
    return filePathTemplate
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.BACKGROUND_EXECUTE_MS || 60000
  }
}

export const sftpTransport = new SftpTransport()
