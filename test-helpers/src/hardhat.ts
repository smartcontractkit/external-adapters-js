import { JsonRpcServer } from 'hardhat/internal/hardhat-network/jsonrpc/server'
import { TASK_NODE_GET_PROVIDER, TASK_NODE_CREATE_SERVER } from 'hardhat/builtin-tasks/task-names'
import { run } from 'hardhat'

export async function startChain(port = 7545): Promise<JsonRpcServer> {
  console.log('Starting hardhat')
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

export const TESTING_PRIVATE_KEY =
  '0x90125e49d93a24cc8409d1e00cc69c88919c6826d8bbabb6f2e1dc8213809f4c'
