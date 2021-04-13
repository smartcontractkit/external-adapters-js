import * as chalk from 'chalk'
import * as shell from 'shelljs'
const { red } = chalk
const { log } = console

const ADAPTER_TYPES = ['composite', 'source']

function main() {
  const type: string = process.argv[2]
  if (!type) return log(red('Missing first argument: type'))
  if (!ADAPTER_TYPES.includes(type))
    return log(red(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`))

  const n: string = process.argv[3]
  if (!n) return log(red('Missing second argument: name'))

  // check if jq is installed (jq used later to modify json files)
  const jq: string = shell.exec('command -v jq').toString()
  if (!jq) return log(red('jq is not installed'))

  // copying files
  shell.mkdir(`packages/${type}s/${n}`)
  shell.cp('-R', `packages/examples/${type}/*`, `packages/${type}s/${n}`)

  // add to yarn workflow
  shell
    .cat('.github/strategy/adapters.json')
    .exec(`jq '.${type}s.adapter += ["${n}"]'`)
    .exec('tee .github/strategy/adapters.json')
    .to('.github/strategy/adapters.json')

  // add to packages/tsconfig.json
  shell
    .cat('packages/tsconfig.json')
    .exec(`jq '.references += [{"path": "./${type}s/${n}"}]'`)
    .exec('tee packages/tsconfig.json')
    .to('packages/tsconfig.json')

  // add to ea legos package for source adapters
  if (type === 'source') {
    const legos_path = 'packages/core/legos'

    // update legos/tsconfig.json
    shell
      .cat(`${legos_path}/tsconfig.json`)
      .exec(`jq '.references += [{"path": "../../${type}s/${n}"}]'`)
      .exec(`tee ${legos_path}/tsconfig.json`)
      .to(`${legos_path}/tsconfig.json`)

    // update legos/package.json
    shell
      .cat(`${legos_path}/package.json`)
      .exec(`jq '.dependencies += {"@chainlink/${n}-adapter": "*"}'`)
      .exec(`tee ${legos_path}/package.json`)
      .to(`${legos_path}/package.json`)

    // updating loegs/src/sources.ts
    let output = shell.cat(`${legos_path}/src/sources.ts`).split('\n')
    const insert_index = output.indexOf('')
    output.splice(insert_index, 0, `import * as ${n} from '@chainlink/${n}-adapter'`) // insert import statement
    output.splice(-2, 0, `  ${n},`) // insert in the export default object
  }

  // editing adapter README
  shell
    .cat(`packages/${type}s/${n}/package.json`)
    .exec(
      `jq '.name = "@chainlink/${n}-adapter" | .description = "Chainlink ${n} adapter." | .keywords += ["${n}"]'`,
    )
    .exec(`tee packages/${type}s/${n}/package.json`)
    .to(`packages/${type}s/${n}/package.json`)

  // changing README to use the adapter name instead of example
  const n_cap: string = n[0].toUpperCase() + n.slice(1)
  shell.sed('-i', 'Example', n_cap, `packages/${type}s/${n}/README.md`)
}

main()
