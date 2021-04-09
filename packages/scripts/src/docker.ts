import * as shell from 'shelljs'
import { logRed } from './utils'

const ADAPTER_TYPES = ['composites', 'sources', 'core', 'examples', 'targets']

// yarn docker sources amberdata public.ecr.aws/${{ env.publicecr-name }}/adapters/
// public.ecr.aws/chainlink-staging/adapters/@chainlink/1forge-adapter:
export function generateDockerFile(): void {
  const type: string = process.argv[2]
  if (!type) return logRed('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type))
    return logRed(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  const n: string = process.argv[3]
  if (!n) return logRed('Missing second argument: name')

  const repo: string = process.argv[4] || ''
  const tag: string = process.argv[5]

  const pkg = JSON.parse(shell.cat(`packages/${type}/${n}/package.json`)).name
  const fullTag = `${repo}${n}-adapter`
  const name = `${tag ? `-t ${repo}${pkg}${tag}` : ''}`
  shell.exec(
    `docker build --build-arg location=packages/${type}/${n} --build-arg package=${pkg} -f Dockerfile . -t ${fullTag} ${name} `,
  )
}
