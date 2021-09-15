import * as client from 'prom-client'

export const redis_connections_open = new client.Counter({
  name: 'redis_connections_open',
  help: 'The number of redis connections that are open',
})

export const redis_retries_count = new client.Counter({
  name: 'redis_retries_count',
  help: 'The number of retries that have been made to establish a redis connection',
})

export enum CMD_SENT_STATUS {
  FAIL = 'FAIL',
  SUCCESS = 'SUCCESS',
}
export const redis_commands_sent_count = new client.Counter({
  name: 'redis_commands_sent_count',
  help: 'The number of redis commands sent',
  labelNames: ['status', 'function_name'],
})
