/**
 * Sharded WebSocket transport.
 *
 * Wraps N inner `WebsocketReverseMappingTransport` instances and routes each
 * subscription to one of them based on a stable hash of (base, quote). Each
 * inner transport opens its own WebSocket connection. This is useful when the
 * data provider enforces a per-connection subscription cap and high-volume
 * deployments need to fit more pairs than a single connection can hold.
 *
 * The inner transports all share the same response cache, so callers (and the
 * cache key seen by the foreground HTTP request) don't need to know which
 * shard owns which pair. Each shard gets its own subscription set so a shard
 * only ever subscribes to pairs that hash to it.
 */
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  WebsocketReverseMappingTransport,
  WebsocketTransportGenerics,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { AdapterRequest, makeLogger } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

const logger = makeLogger('ShardedWsTransport')

type PairParams = { base: string; quote: string }

export class ShardedWebsocketReverseMappingTransport<T extends WebsocketTransportGenerics, K>
  implements Transport<T>
{
  name = 'sharded-ws'
  responseCache!: ResponseCache<T>
  private shards: WebsocketReverseMappingTransport<T, K>[]

  constructor(
    private numShards: number,
    factory: (shardIndex: number) => WebsocketReverseMappingTransport<T, K>,
  ) {
    if (numShards < 1) throw new Error('numShards must be >= 1')
    this.shards = Array.from({ length: numShards }, (_, i) => factory(i))
  }

  // Stable hash of (base+quote) → shard index. Same pair always lands on the
  // same shard, even across pod restarts.
  private shardFor(params: PairParams): number {
    const key = `${params.base}${params.quote}`.toUpperCase()
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0
    }
    return Math.abs(hash) % this.numShards
  }

  async initialize(
    dependencies: TransportDependencies<T>,
    adapterSettings: T['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    logger.info(`Initializing ${this.numShards} WS shards for ${transportName}`)
    // Each shard must have a UNIQUE name when initialize() runs so the framework
    // builds a per-shard subscription set (otherwise with CACHE_TYPE=redis all
    // shards share a single redis-backed set and every shard ends up subscribing
    // to every pair via its own WS — defeating the sharding).
    //
    // After initialize, we restore `name` to the canonical transportName so the
    // response cache writes from the inner transport land under the key the
    // foreground HTTP request expects (`...-${transportName}-${params}`).
    await Promise.all(
      this.shards.map((s, i) =>
        s
          .initialize(dependencies, adapterSettings, endpointName, `${transportName}-shard-${i}`)
          .then(() => {
            ;(s as unknown as { name: string }).name = transportName
          }),
      ),
    )
    // All shards share the same response cache (passed via dependencies).
    this.responseCache = this.shards[0]!.responseCache
  }

  async registerRequest(
    req: AdapterRequest<TypeFromDefinition<T['Parameters']>>,
    adapterSettings: T['Settings'],
  ): Promise<void> {
    const data = req.requestContext.data as unknown as PairParams
    const idx = this.shardFor(data)
    const shard = this.shards[idx]!
    if (shard.registerRequest) return shard.registerRequest(req, adapterSettings)
  }

  async backgroundExecute(context: EndpointContext<T>): Promise<void> {
    await Promise.all(
      this.shards.map((s) => (s.backgroundExecute ? s.backgroundExecute(context) : undefined)),
    )
  }
}
