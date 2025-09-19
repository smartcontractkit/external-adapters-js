import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ConnectOptions } from 'ssh2-sftp-client'
import { BaseEndpointTypes, IndexResponseData, inputParameters } from '../endpoint/sftp'
import { CSVParserFactory } from '../parsing/factory'
import { instrumentToDirectoryMap, instrumentToFileRegexMap, validateInstrument } from './constants'
import { getFileContentsFromFileRegex } from './utils'

const logger = makeLogger('FTSE SFTP Adapter')

type RequestParams = typeof inputParameters.validated

export class SftpTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string

  constructor() {
    super()
  }

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
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
    }

    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const { filename, result, parsedData } = await this.tryDownloadAndParseFile(param.instrument)

    logger.debug(`Successfully processed data for instrument: ${param.instrument}`)
    return {
      data: {
        filename,
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

  private async tryDownloadAndParseFile(instrument: string): Promise<{
    filename: string
    result: number
    parsedData: IndexResponseData
  }> {
    validateInstrument(instrument)

    const connectOptions: ConnectOptions = {
      host: this.config.SFTP_HOST,
      port: this.config.SFTP_PORT,
      username: this.config.SFTP_USERNAME,
      password: this.config.SFTP_PASSWORD,
      readyTimeout: 30000,
    }

    const directory = instrumentToDirectoryMap[instrument]
    const filenameRegex = instrumentToFileRegexMap[instrument]

    const { filename, fileContent } = await getFileContentsFromFileRegex({
      connectOptions,
      directory,
      filenameRegex,
    })

    // we need latin1 here because the file contains special characters like "®"
    const csvContent = fileContent.toString('latin1')

    const parser = CSVParserFactory.detectParserByInstrument(instrument)

    if (!parser) {
      throw new AdapterInputError({
        statusCode: 500,
        message: `Parser initialization failed for instrument: ${instrument}`,
      })
    }

    const { result, parsedData } = await parser.parse(csvContent)

    return {
      filename,
      result,
      parsedData: parsedData as IndexResponseData,
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.BACKGROUND_EXECUTE_MS || 60000
  }
}

export const sftpTransport = new SftpTransport()
