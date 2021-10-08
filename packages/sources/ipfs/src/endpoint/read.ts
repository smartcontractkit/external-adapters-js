import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { IPFS } from 'ipfs-core-types'
import { create } from 'ipfs-http-client'
import { CID } from 'multiformats/cid'
import { AsyncReturnType } from 'type-fest'
import { deserialize } from '../codec'
export type IPFSPath = string | CID
export { CID }

export const supportedEndpoints = ['read']

const customParams = {
  cid: false,
  ipns: false,
  codec: false,
  type: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let cid: IPFSPath = validator.validated.data.cid
  const ipns = validator.validated.data.ipns
  const type = validator.validated.data.type || 'raw'

  if (!cid && !ipns) {
    throw Error('Request is missing both "cid" and "ipns". One is required.')
  }

  const client = create({ url: config.api.baseURL })

  // If CID is not included, we try to resolve IPNS
  if (!cid) {
    for await (const ipfsCid of client.name.resolve(`/ipns/${ipns}`)) {
      cid = ipfsCid.replace('/ipfs/', '')
    }
  }

  const codec = validator.validated.data.codec

  let result: AsyncReturnType<typeof readFile | typeof readDag>
  switch (type) {
    case 'raw':
      result = await readFile(cid, codec, client)
      break
    case 'dag':
      result = await readDag(cid, client)
      break
    default:
      throw Error(`Unknown type: ${type}`)
  }

  const response = {
    data: { result },
  }

  return Requester.success(jobRunID, response)
}

const readFile = async (cid: IPFSPath, codec: string, client: IPFS) => {
  const stream = client.cat(cid)

  let data = Buffer.from([])
  for await (const chunk of stream) {
    data = Buffer.concat([data, chunk])
  }

  return deserialize(data, codec)
}

const readDag = async (cid: IPFSPath, client: IPFS) => {
  if (typeof cid === 'string') {
    cid = CID.parse(cid)
  }

  const result = await client.dag.get(cid as CID)
  return result.value
}
