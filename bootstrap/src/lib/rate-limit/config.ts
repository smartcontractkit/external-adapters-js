import objectHash from 'object-hash'

export interface Config {
  hashOpts: Required<Parameters<typeof objectHash>>['1']
  totalCapacity: number
}

export function getConfig(): Config {
  return {
    hashOpts: {
      algorithm: 'sha1',
      encoding: 'hex',
      excludeKeys: (props: string) =>
        ['jobId', 'id', 'maxAge', 'meta']
          .concat((process.env.CACHE_KEY_IGNORED_PROPS || '').split(',').filter((k) => k))
          .includes(props),
    },
    totalCapacity: parseInt(process.env.RATE_LIMIT_CAPACITY || ''),
  }
}
