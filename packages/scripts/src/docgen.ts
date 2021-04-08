import * as shell from 'shelljs'
import swaggerJsdoc from 'swagger-jsdoc'

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

  // generate OAS spec using code comments (uses swagger-jsdoc)
  const oas_filepath = `${adapter_filepath}/oas.json`
  const apis_str = shell.exec(`find ${adapter_filepath}/src -type f`).toString() //get all files in the src folder
  const apis: ReadonlyArray<string> = apis_str.split('\n').slice(0, -1) //split into array
  const oas = swaggerJsdoc({ definition, apis })

  // write spec to file
  shell.ShellString(JSON.stringify(oas)).to(oas_filepath)
})()
