// Wraps an object such that accessing properties that do not exist will throw
// an error instead of returning undefined.
//
// This is useful during unit test creation, as it makes it clear which
// properties are missing rather than giving an error later on that undefined
// doesn't have some other property.
//
// Once a test is passing, you can remove the wrapping and the test will still
// pass. But it might be useful to keep it for when the code under test is
// changed later on.
//
// Example usage:
//
// In code under test:
//
//   function doThing(obj) {
//     const baz = obj.foo.baz
//     ...
//   }
//
// In test code:
//
//   const obj = makeStub('obj', { foo: { bar: 1 } })
//   doThing(obj)
//
// Throws (and logs, in case the error is caught by the code under test):
// Error: Property 'obj.foo.baz' does not exist
export function makeStub<T>(name: string, target: T): T {
  if (target === null || typeof target !== 'object') {
    return target
  }
  return new Proxy(target, {
    get: (target, prop) => {
      const propName = `${name}.${String(prop)}`
      if (!(prop in target) && !isPropAllowedUndefined(prop)) {
        const message = `Property '${propName}' does not exist`
        console.error(message)
        throw new Error(message)
      }
      return makeStub(propName, (target as any)[prop])
    },
  }) as T
}

// Properties checked by jest which don't need to be defined:
const allowedUndefinedProps = [
  '$$typeof',
  'nodeType',
  'tagName',
  'hasAttribute',
  '@@__IMMUTABLE_ITERABLE__@@',
  '@@__IMMUTABLE_RECORD__@@',
  'toJSON',
  'asymmetricMatch',
  'then',
]

const isPropAllowedUndefined = (prop: string | Symbol) => {
  return typeof prop === 'symbol' || allowedUndefinedProps.includes(prop)
}
