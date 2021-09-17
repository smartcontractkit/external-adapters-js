import * as client from 'prom-client'

export const cache_warmer_count = new client.Gauge({
  name: 'cache_warmer_get_count',
  help: 'The number of cache warmers running',
})

export const cache_warmer_batch_count = new client.Gauge({
  name: 'cache_warmer_batching_get_count',
  help: 'The number of batching cache warmers running',
})
