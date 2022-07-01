import { AdapterInputError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { create, IPFSHTTPClient } from 'ipfs-http-client'
import { CID } from 'multiformats/cid'
import { AsyncReturnType } from 'type-fest'
import { deserialize } from '../codec'
export type IPFSPath = string | CID
export { CID }

export const supportedEndpoints = ['read']

export const description = 'Read data from IPFS'

export type TInputParameters = { cid: string; ipns: string; codec: string; type: string }
export const inputParameters: InputParameters<TInputParameters> = {
  cid: {
    required: false,
    description: 'The CID to read. Required if IPNS is not set',
    exclusive: ['ipns'],
  },
  ipns: {
    required: false,
    description: 'The IPNS to read. Required if CID is not set',
    exclusive: ['cid'],
  },
  codec: {
    required: false,
    description: 'The codec to convert the data, if necessary when type is `raw`',
    type: 'string',
    options: ['json', 'dag-cbor'],
  },
  type: {
    required: false,
    description: 'The type of data to read',
    type: 'string',
    options: ['raw', 'dag'],
    default: 'raw',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  let cid: IPFSPath = validator.validated.data.cid
  const ipns = validator.validated.data.ipns
  const type = validator.validated.data.type || 'raw'

  if (!cid && !ipns) {
    throw new AdapterInputError({
      message: 'Request is missing both "cid" and "ipns". One is required.',
    })
  }

  const client = create({ url: config.api?.baseURL })

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
      throw new AdapterInputError({ message: `Unknown type: ${type}` })
  }

  const response = {
    data: { result },
  }

  return Requester.success(jobRunID, response)
}

const readFile = async (cid: IPFSPath, codec: string, client: IPFSHTTPClient) => {
  const stream = client.cat(cid)

  let data = Buffer.from([])
  for await (const chunk of stream) {
    data = Buffer.concat([data, chunk])
  }

  return deserialize(data, codec)
}

const readDag = async (cid: IPFSPath, client: IPFSHTTPClient) => {
  if (typeof cid === 'string') {
    cid = CID.parse(cid)
  }

  const result = await client.dag.get(cid as CID)
  return result.value
}
