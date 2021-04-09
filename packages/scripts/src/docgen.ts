import * as shell from 'shelljs'
import swaggerJsdoc from 'swagger-jsdoc'
import { logRed } from './utils'

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

function generate_OAS(type: string, n: string) {
  // reused filepath
  const adapter_filepath = `packages/${type}s/${n}`

  // parse the package.json file
  const package_data: string = shell.cat(`${adapter_filepath}/package.json`).toString()
  const package_obj = JSON.parse(package_data)

  // create the definition.json file
  const definition: OASpec = generate_spec(package_obj)

  // generate OAS spec using code comments (uses swagger-jsdoc)
  const oas_filepath = `${adapter_filepath}/oas.json`
  const apis = shell.ls(`${adapter_filepath}/src/**/*.ts`) //recursive filepath searching
  const oas = swaggerJsdoc({ definition, apis, failOnErrors: true })

  // write spec to file
  shell.ShellString(JSON.stringify(oas, null, 2)).to(oas_filepath)
}

const ADAPTER_TYPES = ['composite', 'source', 'target']
;(() => {
  if (process.argv.includes('--all')) {
    console.log('Generating OAS.json for all EAs')

    // run for each adapter type
    ADAPTER_TYPES.forEach(type => {
      // get EA name
      const out = shell.ls('-d', `packages/${type}s/*/`)
      const n_list = out.map(n => n.split('/')[2]) // retrieve folder name from full path

      // run for each adapter for each type
      n_list.forEach(n => {
        try {
          generate_OAS(type, n)
        } catch (e) {
          logRed(`Failed to generate OAS.json for ${type}/${n}:\n${e}`)
        }
      })
    })
    return
  }

  const type: string = process.argv[2]
  if (!type) return logRed('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type))
    return logRed(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  const n: string = process.argv[3]
  if (!n) return logRed('Missing second argument: name')

  generate_OAS(type, n)
})()
