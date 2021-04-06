import * as shell from 'shelljs'

const log = { red: (text: string) => console.log('\x1b[31m%s\x1b[0m', text) }

const ADAPTER_TYPES = ['composite', 'source']

;(() => {
  const type: string = process.argv[2]
  if (!type) return log.red('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type))
    return log.red(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  const n: string = process.argv[3]
  if (!n) return log.red('Missing second argument: name')

  // check if jq is installed (jq used later to modify json files)
  const jq: string = shell.exec('command -v jq').toString()
  if (!jq) return log.red('jq is not installed')

  // copying files and adding to adapter lists
  shell.mkdir(`packages/${type}s/${n}`)
  shell.cp('-R', `packages/examples/${type}/*`, `packages/${type}s/${n}`)
  shell
    .cat('.github/strategy/adapters.json')
    .exec(`jq '.${type}s.adapter += ["${n}"]'`)
    .exec('tee .github/strategy/adapters.json')
    .to('.github/strategy/adapters.json')
  shell
    .cat(`packages/${type}s/${n}/package.json`)
    .exec(
      `jq '.name = "@chainlink/${n}-adapter" | .description = "Chainlink ${n} adapter." | .keywords += ["${n}"]'`,
    )
    .exec(`tee packages/${type}s/${n}/package.json`)
    .to(`packages/${type}s/${n}/package.json`)

  // changing README to use the adapter name instead of example
  const n_cap: string = n[0].toUpperCase()+n.slice(1)
  shell.sed('-i', 'Example', n_cap,`packages/${type}s/${n}/README.md`)
})()
