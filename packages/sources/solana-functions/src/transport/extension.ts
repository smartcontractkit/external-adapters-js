import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Address } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, RequestParams } from '../endpoint/extension'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('ExtensionTransport')

const getFieldFromBuffer = (
  field: { name: string; type: string; offset: number },
  buffer: Buffer,
): number | string => {
  switch (field.type) {
    case 'uint64':
      return buffer.readBigUInt64LE(field.offset).toString()
    case 'int64':
      return buffer.readBigInt64LE(field.offset).toString()
    case 'float64':
      return buffer.readDoubleLE(field.offset)
    default:
      throw new AdapterInputError({
        message: `Unsupported base field type '${field.type}'`,
        statusCode: 400,
      })
  }
}

const getExtensionField = (
  field: { name: string; type: string; extensionType: number; offset: number },
  extensionDataByType: Record<number, Buffer>,
): number | string => {
  const extensionData = extensionDataByType[field.extensionType]
  if (!extensionData) {
    throw new AdapterInputError({
      message: `No extension data found for extension type '${field.extensionType}'`,
      statusCode: 400,
    })
  }
  return getFieldFromBuffer(field, extensionData)
}

const getExtensionDataByType = (buffer: Buffer, offset: number): Record<number, Buffer> => {
  const extensionDataByType: Record<number, Buffer> = {}
  while (offset + 4 <= buffer.length) {
    const extensionType = buffer.readUInt16LE(offset)
    offset += 2
    const extensionLength = buffer.readUInt16LE(offset)
    offset += 2
    const extensionData = buffer.slice(offset, offset + extensionLength)
    extensionDataByType[extensionType] = extensionData
    offset += extensionLength
  }
  if (offset !== buffer.length) {
    throw new AdapterInputError({
      message: `Extension data parsing did not consume entire buffer. Final offset: ${offset}, buffer length: ${buffer.length}`,
      statusCode: 400,
    })
  }
  return extensionDataByType
}

export class ExtensionTransport extends SubscriptionTransport<BaseEndpointTypes> {
  rpc!: Rpc<SolanaRpcApi>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.rpc = new SolanaRpcFactory().create(adapterSettings.RPC_URL)
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
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const encoding = 'base64'
    const resp = await this.rpc
      .getAccountInfo(params.stateAccountAddress as Address, { encoding })
      .send()
    const data = Buffer.from(resp.value?.data[0] as string, encoding)
    const resultData: Record<string, number | string> = {}

    if (params.baseFields?.length ?? 0 > 0) {
      for (const baseField of params.baseFields) {
        resultData[baseField.name] = getFieldFromBuffer(baseField, data)
      }
    }

    if (params.extensionFields?.length ?? 0 > 0) {
      const extensionDataByType = getExtensionDataByType(data, params.extensionDataOffset)

      for (const extensionField of params.extensionFields) {
        resultData[extensionField.name] = getExtensionField(extensionField, extensionDataByType)
      }
    }

    return {
      data: resultData,
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const extensionTransport = new ExtensionTransport()
