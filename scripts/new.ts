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

  shell.mkdir(`packages/${type}s/${n}`)
  shell.cp('-R', `packages/examples/${type}/*`, `packages/${type}s/${n}`)
  // cp -R will not copy hidden & special files, so we copy manualy
  shell.cp(`packages/examples/${type}/.eslintrc.js`, `packages/${type}s/${n}`)
  shell
    .cat('.github/strategy/adapters.json')
    .exec(`jq '.${type}.adapter += ["${n}"]'`)
    .exec('tee .github/strategy/adapters.json')
    .to('.github/strategy/adapters.json')
  shell
    .cat(`packages/${type}s/${n}/package.json`)
    .exec(
      `jq '.name = "@chainlink/${n}-adapter" | .description = "Chainlink ${n} adapter." | .keywords += ["${n}"]'`,
    )
    .exec(`tee packages/${type}s/${n}/package.json`)
    .to(`packages/${type}s/${n}/package.json`)
  shell.sed('-i', `s/Example/${n}/`, `packages/${type}s/${n}/README.md`)
})()
