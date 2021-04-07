import * as shell from 'shelljs'

const log = { red: (text: string) => console.log('\x1b[31m%s\x1b[0m', text) }

interface OASpec {
  openapi: string
  info: {
    title: string
    version: string
    license?: {
      name: string
    }
  }
}

function generate_spec(p: any) {
  const obj: OASpec = { openapi: '3.0.0', info: { title: p.name, version: p.version } }
  if (p.license) {
    obj.info.license = { name: p.license }
  }
  return obj
}

const ADAPTER_TYPES = ['composite', 'source', 'target']
;(() => {
  const type: string = process.argv[2]
  if (!type) return log.red('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type))
    return log.red(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  const n: string = process.argv[3]
  if (!n) return log.red('Missing second argument: name')

  // reused filepath
  const adapter_filepath = `packages/${type}s/${n}`

  // parse the package.json file
  const package_data: string = shell.cat(`${adapter_filepath}/package.json`).toString()
  const package_obj = JSON.parse(package_data)

  // create the definition.json file
  const definition: OASpec = generate_spec(package_obj)
  const def_filepath = `${adapter_filepath}/definition_temp.json`
  shell.ShellString(JSON.stringify(definition)).to(def_filepath)

  //generate OAS spec using code comments (uses swagger-jsdoc)
  const oas_filepath = `${adapter_filepath}/oas.json`
  // -d: base definition file
  // $(find ...): finds all files in /src file to search for comments
  // -o: outputs to specific file
  shell.exec(
    `npx swagger-jsdoc@6 -d ${def_filepath} $(find ${adapter_filepath}/src -type f) -o ${oas_filepath}`,
  )

  //remove definition file
  shell.rm(def_filepath)
})()
