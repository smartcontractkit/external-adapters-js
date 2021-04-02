import * as shell from 'shelljs'

const log = { red: (text: string) => console.log('\x1b[31m%s\x1b[0m', text) }

const ADAPTER_TYPES = ['composites', 'sources', 'core', 'examples', 'targets']

;(() => {
  const type: string = process.argv[2]
  if (!type) return log.red('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type))
    return log.red(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  const n: string = process.argv[3]
  if (!n) return log.red('Missing second argument: name')

  const repo: string = process.argv[4] || ''
  const tag: string = process.argv[5]

  const pkg = JSON.parse(shell.cat(`packages/${type}/${n}/package.json`)).name
  shell.exec(
    `docker build --build-arg type=${type} --build-arg name=${n} --build-arg package=${pkg} -f Dockerfile . -t ${repo}${n}-adapter ${
      tag ? `-t ${repo}${pkg}${tag}` : ''
    }`,
  )
})()
