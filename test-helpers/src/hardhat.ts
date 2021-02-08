import { JsonRpcServer } from 'hardhat/internal/hardhat-network/jsonrpc/server'
import { TASK_NODE_GET_PROVIDER, TASK_NODE_CREATE_SERVER } from 'hardhat/builtin-tasks/task-names'
import { run } from 'hardhat'

export async function startChain(): Promise<JsonRpcServer> {
  console.log('Starting hardhat')
  //TODO: details could be provided by config, with defaults
  // unususal number in order not to have conflicts when running on tests
  const port = 4444
  const hostname = 'localhost'
  const provider = await run(TASK_NODE_GET_PROVIDER)

  // Disable logging
  // if (Boolean(config.VERBOSE) !== true)
  await provider.request({
    method: 'hardhat_setLoggingEnabled',
    params: [false],
  })

  // Start Hardhat network
  const server: JsonRpcServer = await run(TASK_NODE_CREATE_SERVER, {
    hostname,
    port,
    provider,
  })

  // Wait until server is ready for requests
  await server.listen()
  console.log(`Hardhat listening on localhost:${port}`)
  return server
}
