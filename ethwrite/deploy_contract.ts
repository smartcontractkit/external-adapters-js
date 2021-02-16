import { deploy } from './src/contract_helpers'
;(async function () {
  if (process.env.PRIVATE_KEY && process.env.RPC_URL) {
    deploy(process.env.PRIVATE_KEY, process.env.RPC_URL)
  } else {
    console.log('Please set PRIVATE_KEY and RPC_URL env vars')
  }
})()
