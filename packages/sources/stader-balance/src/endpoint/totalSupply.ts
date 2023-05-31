import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { config } from '../config'
import { ethers } from 'ethers'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  StaderConfigContract_ABI,
  StaderEthX_ABI,
  StaderOracle_ABI,
} from '../abi/StaderContractAbis'
import { chainIds, networks, staderNetworkChainMap } from './utils'

const logger = makeLogger('StaderTotalSupplyLogger')

const inputParameters = new InputParameters({
  staderConfigAddress: {
    description: 'The address of the Stader Config contract.',
    type: 'string',
  },
  network: {
    description: 'The name of the target custodial network protocol',
    options: networks,
    type: 'string',
    default: 'ethereum',
  },
  chainId: {
    description: 'The name of the target custodial chain',
    options: chainIds,
    type: 'string',
    default: 'mainnet',
  },
  confirmations: {
    type: 'number',
    description: 'The number of confirmations to query data from',
    default: 0,
  },
  syncWindow: {
    description:
      "The number of blocks Stader's reported block cannot be within of the current block. Used to ensure the balance and total supply feeds are reporting info from the same block.",
    default: 300,
    type: 'number',
  },
})

type RequestParams = typeof inputParameters.validated

interface ResponseSchema {
  Data: {
    result: string
  }
  Result: string
}

type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: ResponseSchema
}

export class TotalSupplyTransport extends SubscriptionTransport<EndpointTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
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
    context: EndpointContext<EndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (!entries.length) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
      return
    }
    await Promise.all(entries.map(async (req) => this.handleRequest(req)))
  }

  async handleRequest(req: RequestParams): Promise<void> {
    // We're making a lot of requests in this complex logic, so we start counting the time
    // it takes for the provider to reply from here, accounting for all requests involved
    const providerDataRequestedUnixMs = Date.now()
    let response: AdapterResponse<EndpointTypes['Response']>

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

export const totalSupplyEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'totalSupply',
  transport: new TotalSupplyTransport(),
  inputParameters,
})
