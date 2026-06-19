import { GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import * as crypto from 'crypto'
import { BaseEndpointTypes, inputParameters } from '../endpoint/types'
import { isFresh, isSaneSignature, rescale } from './utils'

const logger = makeLogger('InfralabsTransport')

type RequestParams = typeof inputParameters.validated

interface InfralabsResponse {
  value: string
  scale: string
  timestamp: string
  signature: string
  key_id: string
}

interface KmsCacheEntry {
  key: crypto.KeyObject
  derBytes: Buffer
  fetchedAt: number
}

export class InfralabsTransport extends SubscriptionTransport<BaseEndpointTypes> {
  settings!: BaseEndpointTypes['Settings']
  requester!: Requester
  kmsClient!: KMSClient
  private apiEndpoint!: string
  private maxStaleness!: number
  private kmsKeyCache = new Map<string, KmsCacheEntry>()
  private kmsKeyTtlMs!: number

  constructor(
    private readonly apiEndpointFn: (s: BaseEndpointTypes['Settings']) => string,
    private readonly maxStalenessFn: (s: BaseEndpointTypes['Settings']) => number,
  ) {
    super()
  }

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.kmsClient = new KMSClient({
      region: adapterSettings.KMS_REGION,
      credentials: {
        accessKeyId: adapterSettings.AWS_ACCESS_KEY_ID,
        secretAccessKey: adapterSettings.AWS_SECRET_ACCESS_KEY,
      },
    })
    this.kmsKeyTtlMs = adapterSettings.KMS_KEY_TTL_MS
    this.apiEndpoint = this.apiEndpointFn(adapterSettings)
    this.maxStaleness = this.maxStalenessFn(adapterSettings)
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    await Promise.all(entries.map((param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams): Promise<void> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
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

  async _handleRequest(): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    // Fetch raw response body as text to preserve exact bytes for sig verification
    const requestConfig = {
      url: this.apiEndpoint,
      method: 'GET' as const,
      headers: { Authorization: `ApiKey ${this.settings.API_KEY}` },
      responseType: 'text' as const,
    }
    const sourceResponse = await this.requester.request<string>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    const rawResponseBody = sourceResponse.response.data
    const responseBody = JSON.parse(rawResponseBody) as InfralabsResponse
    const signature = responseBody.signature

    if (!this.settings.KMS_VERIFICATION_DISABLED) {
      const publicKey = await this.getKmsPublicKey(responseBody.key_id)

      if (!isSaneSignature(rawResponseBody, publicKey, signature)) {
        // Verification failed with the cached key - the provider may have rotated their KMS key.
        // Fetch the latest key from AWS: if it's the same key, the signature is genuinely invalid;
        // if it's a new key, try verification once more with the rotated key before giving up.
        const { key: refreshedKey, isNewKey } = await this.tryRefreshKmsKey(responseBody.key_id)
        if (!isNewKey) throw new Error('Signature verification failed')

        if (!isSaneSignature(rawResponseBody, refreshedKey, signature))
          throw new Error('Signature verification failed')
      }
    }

    if (!isFresh(responseBody.timestamp, this.maxStaleness, Date.now()))
      throw new Error('Price is stale')

    const scale = parseInt(responseBody.scale)
    const result = rescale(responseBody.value, scale)

    return {
      result: result.toString(),
      data: {
        price: Number(result) / 10 ** 8,
        rawValue: responseBody.value,
        scale,
        lastUpdatedAt: parseInt(responseBody.timestamp),
        signature: signature,
      },
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: parseInt(responseBody.timestamp) * 1000,
      },
    }
  }

  /** Fetches the public key for `keyId` directly from AWS KMS and returns it alongside its raw DER
   *  bytes, which are used for cache-equality checks in `tryRefreshKmsKey`. */
  private async fetchKmsKeyFromAws(
    keyId: string,
  ): Promise<{ key: crypto.KeyObject; derBytes: Buffer }> {
    const kmsResponse = await this.kmsClient.send(new GetPublicKeyCommand({ KeyId: keyId }))
    if (!kmsResponse.PublicKey) {
      throw new Error(`KMS did not return a public key for key ID: ${keyId}`)
    }

    const derBytes = Buffer.from(kmsResponse.PublicKey)
    const key = crypto.createPublicKey({ key: derBytes, format: 'der', type: 'spki' })
    return { key, derBytes }
  }

  /** Returns the cached public key for `keyId` if it was fetched within `kmsKeyTtlMs`; otherwise
   *  fetches a fresh copy from AWS and updates the cache. */
  private async getKmsPublicKey(keyId: string): Promise<crypto.KeyObject> {
    const cached = this.kmsKeyCache.get(keyId)
    if (cached && Date.now() - cached.fetchedAt < this.kmsKeyTtlMs) return cached.key

    // Always re-populate cache if key is expired
    const { key, derBytes } = await this.fetchKmsKeyFromAws(keyId)
    this.kmsKeyCache.set(keyId, { key, derBytes, fetchedAt: Date.now() })

    return key
  }

  /** Fetches the current key from AWS and compares it to the cached copy. Returns the fresh key and
   *  whether it differs from what was cached — callers use `isNewKey` to distinguish a genuine
   *  signature failure from a key rotation that invalidated the cache. */
  private async tryRefreshKmsKey(
    keyId: string,
  ): Promise<{ key: crypto.KeyObject; isNewKey: boolean }> {
    const cached = this.kmsKeyCache.get(keyId)
    const { key, derBytes } = await this.fetchKmsKeyFromAws(keyId)
    if (cached && cached.derBytes.equals(derBytes)) return { key: cached.key, isNewKey: false }
    this.kmsKeyCache.set(keyId, { key, derBytes, fetchedAt: Date.now() })

    return { key, isNewKey: true }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
