import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import SftpClient from 'ssh2-sftp-client'
import { BaseEndpointTypes, inputParameters } from '../endpoint/sftp'
import { CSVParserFactory } from '../parsing/factory'
import { instrumentToFilePathMap, instrumentToFileRegexMap } from './constants'

const logger = makeLogger('FTSE SFTP Adapter')

type RequestParams = typeof inputParameters.validated

export class SftpTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
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
    } catch (e: unknown) {
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
    const result = await this.tryDownloadAndParseFile(param.instrument)

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
    const connectConfig: any = {
      host: this.config.SFTP_HOST,
      port: this.config.SFTP_PORT || 22,
      username: this.config.SFTP_USERNAME,
      password: this.config.SFTP_PASSWORD,
      readyTimeout: 30000,
    }

    try {
      await this.sftpClient.connect(connectConfig)
      logger.debug('Successfully connected to SFTP server')
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

  private async tryDownloadAndParseFile(instrument: string): Promise<any> {
    const filePath = instrumentToFilePathMap[instrument]
    const fileRegex = instrumentToFileRegexMap[instrument]

    const fileList = await this.sftpClient.list(filePath)

    // Filter files based on the regex pattern
    const matchingFiles = fileList
      .map((file) => file.name)
      .filter((fileName) => fileRegex.test(fileName))

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
        statusCode: 502,
        message: `No suitable parser found for file: ${fullPath} and instrument: ${instrument}`,
      })
    }

    return await parser.parse(csvContent)
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.BACKGROUND_EXECUTE_MS || 60000
  }
}

export const sftpTransport = new SftpTransport()
