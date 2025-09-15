import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { sleep } from '@chainlink/external-adapter-framework/util'
import SftpClient from 'ssh2-sftp-client'
import { BaseEndpointTypes } from '../endpoint/sftp'

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

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>): Promise<void> {
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.BACKGROUND_EXECUTE_MS || 60000
  }
}

export const sftpTransport = new SftpTransport()
