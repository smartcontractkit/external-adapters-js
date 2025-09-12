import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import SftpClient from 'ssh2-sftp-client'
import { BaseEndpointTypes, inputParameters } from '../endpoint/sftp'

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

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, _entries: RequestParams[]) {
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async connectToSftp(): Promise<void> {
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

  async disconnectFromSftp(): Promise<void> {
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

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.BACKGROUND_EXECUTE_MS || 60000
  }
}

export const sftpTransport = new SftpTransport()
