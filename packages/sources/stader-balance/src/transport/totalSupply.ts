import { config } from '../config'
import { ethers } from 'ethers'
import { staderNetworkChainMap } from './utils'
import {
  StaderConfigContract_ABI,
  StaderEthX_ABI,
  StaderOracle_ABI,
} from '../config/StaderContractAbis'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/totalSupply'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'

type RequestParams = typeof inputParameters.validated

const logger = makeLogger('StaderTotalSupplyLogger')

export class TotalSupplyTransport extends SubscriptionTransport<BaseEndpointTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: typeof config.settings,
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.CHAIN_ID,
    )
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    await Promise.all(entries.map(async (req) => this.handleRequest(req)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(req: RequestParams): Promise<void> {
    // We're making a lot of requests in this complex logic, so we start counting the time
    // it takes for the provider to reply from here, accounting for all requests involved
    const providerDataRequestedUnixMs = Date.now()
    let response: AdapterResponse<BaseEndpointTypes['Response']>

    try {
      // Get data for the latest block in the chain
      const latestBlockNum = await this.provider.getBlockNumber()
      const blockTag = latestBlockNum - req.confirmations
      const staderConfigAddress =
        req.staderConfigAddress || staderNetworkChainMap[req.network][req.chainId].staderConfig
      const staderConfig = new ethers.Contract(
        staderConfigAddress,
        StaderConfigContract_ABI,
        this.provider,
      )

      // Build Stader Oracle contract
      const staderOracleAddress: string = await staderConfig.getStaderOracle({ blockTag })
      const staderOracle = new ethers.Contract(staderOracleAddress, StaderOracle_ABI, this.provider)

      // Get the last reported block number from the Stader oracle contract
      const reportedBlock = Number(await staderOracle.getERReportableBlock({ blockTag }))
      logger.debug(`Current block: ${blockTag}. Reported block number: ${reportedBlock}`)

      // Return error if reported block number within sync window
      // Stader wants to sync the block number that both the balance and totalSupply feed report for
      // Setting this window helps ensure the reported block didn't change between the two feeds reporting
      if (reportedBlock >= blockTag - req.syncWindow) {
        const errorMessage = `Reported block number ${reportedBlock} within ${req.syncWindow} blocks of current block ${blockTag}. At risk of being out of sync with balance feed.`
        logger.error(errorMessage)
        response = {
          statusCode: 502,
          errorMessage,
          timestamps: {
            providerDataRequestedUnixMs: 0,
            providerDataReceivedUnixMs: 0,
            providerIndicatedTimeUnixMs: undefined,
          },
        }
      } else {
        // Build the ETHx token contract
        const ethxAddress = await staderConfig.getETHxToken({ blockTag: reportedBlock })
        const ethxContract = new ethers.Contract(ethxAddress, StaderEthX_ABI, this.provider)

        // Fetch total supply at the reported block number retrieve from Stader Oracle
        const totalSupply = (await ethxContract.totalSupply({ blockTag: reportedBlock })).toString()

        logger.debug(`Total supply: ${totalSupply}`)
        response = {
          data: {
            result: totalSupply,
          },
          result: totalSupply,
          statusCode: 200,
          timestamps: {
            providerDataRequestedUnixMs,
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        }
      }
    } catch (e) {
      const errorMessage = 'Failed to retrieve ETHx total supply'
      logger.error(errorMessage)
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

    await this.responseCache.write(this.name, [{ params: req, response }])
  }
}

export const transport = new TotalSupplyTransport()
