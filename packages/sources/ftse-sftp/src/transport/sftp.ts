import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import SftpClient, { FileInfo } from 'ssh2-sftp-client'
import { BaseEndpointTypes, IndexResponseData, inputParameters } from '../endpoint/sftp'
import { CSVParserFactory } from '../parsing/factory'
import { instrumentToFilePathMap, instrumentToFileRegexMap } from './constants'

const logger = makeLogger('FTSE SFTP Adapter')

type RequestParams = typeof inputParameters.validated

interface SftpConnectionConfig {
  host: string
  port: number
  username: string
  password: string
  readyTimeout: number
}

export class SftpTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  sftpClient: SftpClient

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
    this.name = transportName
    this.responseCache = dependencies.responseCache
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } finally {
      try {
        await this.sftpClient.end()
        logger.info('SFTP connection closed')
      } catch (error) {
        logger.error('Error closing SFTP connection:', error)
      }
    }

    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    await this.connectToSftp()

    const parsedData = await this.tryDownloadAndParseFile(param.instrument)

    // Extract the numeric result based on the data type
    let result: number
    if ('gbpIndex' in parsedData) {
      // FTSE data
      result = (parsedData.gbpIndex as number) ?? 0
    } else if ('close' in parsedData) {
      // Russell data
      result = parsedData.close as number
    } else {
      throw new Error('Unknown data format received from parser')
    }

    logger.info(`Successfully processed data for instrument: ${param.instrument}`)
    return {
      data: {
        result: parsedData,
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
    const connectConfig: SftpConnectionConfig = {
      host: this.config.SFTP_HOST,
      port: this.config.SFTP_PORT || 22,
      username: this.config.SFTP_USERNAME,
      password: this.config.SFTP_PASSWORD,
      readyTimeout: 30000,
    }

    try {
      // Create a new client instance to avoid connection state issues
      this.sftpClient = new SftpClient()
      await this.sftpClient.connect(connectConfig)
      logger.info('Successfully connected to SFTP server')
    } catch (error) {
      logger.error(error, 'Failed to connect to SFTP server')
      throw new AdapterInputError({
        statusCode: 500,
        message: `Failed to connect to SFTP server: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      })
    }
  }

  private async tryDownloadAndParseFile(instrument: string): Promise<IndexResponseData> {
    const filePath = instrumentToFilePathMap[instrument]
    const fileRegex = instrumentToFileRegexMap[instrument]

    // Validate that the instrument is supported
    if (!filePath || !fileRegex) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `No parser found for instrument: ${instrument}`,
      })
    }

    const fileList = await this.sftpClient.list(filePath)
    // Filter files based on the regex pattern
    const matchingFiles = fileList
      .map((file: FileInfo) => file.name)
      .filter((fileName: string) => fileRegex.test(fileName))

    if (matchingFiles.length === 0) {
      throw new AdapterInputError({
        statusCode: 500,
        message: `No files matching pattern ${fileRegex} found in directory: ${filePath}`,
      })
    } else if (matchingFiles.length > 1) {
      throw new AdapterInputError({
        statusCode: 500,
        message: `Multiple files matching pattern ${fileRegex} found in directory: ${filePath}.`,
      })
    }
    const fullPath = `${filePath}${matchingFiles[0]}`

    // Log the download attempt
    logger.info(`Downloading file: ${fullPath}`)

    const fileContent = await this.sftpClient.get(fullPath)
    // we need latin1 here because the file contains special characters like "®"
    const csvContent = fileContent.toString('latin1')

    const parser = CSVParserFactory.detectParserByInstrument(instrument)

    if (!parser) {
      throw new AdapterInputError({
        statusCode: 500,
        message: `No parser found for instrument: ${instrument}`,
      })
    }

    return (await parser.parse(csvContent)) as IndexResponseData
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.BACKGROUND_EXECUTE_MS || 60000
  }
}

export const sftpTransport = new SftpTransport()
