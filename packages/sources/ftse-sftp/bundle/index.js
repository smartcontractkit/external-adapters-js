/******/ ;(() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ 313: /***/ (module) => {
      /******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
      /* global global, define, Symbol, Reflect, Promise, SuppressedError, Iterator */
      var __extends
      var __assign
      var __rest
      var __decorate
      var __param
      var __esDecorate
      var __runInitializers
      var __propKey
      var __setFunctionName
      var __metadata
      var __awaiter
      var __generator
      var __exportStar
      var __values
      var __read
      var __spread
      var __spreadArrays
      var __spreadArray
      var __await
      var __asyncGenerator
      var __asyncDelegator
      var __asyncValues
      var __makeTemplateObject
      var __importStar
      var __importDefault
      var __classPrivateFieldGet
      var __classPrivateFieldSet
      var __classPrivateFieldIn
      var __createBinding
      var __addDisposableResource
      var __disposeResources
      var __rewriteRelativeImportExtension
      ;(function (factory) {
        var root =
          typeof global === 'object'
            ? global
            : typeof self === 'object'
            ? self
            : typeof this === 'object'
            ? this
            : {}
        if (typeof define === 'function' && define.amd) {
          define('tslib', ['exports'], function (exports) {
            factory(createExporter(root, createExporter(exports)))
          })
        } else if (true && typeof module.exports === 'object') {
          factory(createExporter(root, createExporter(module.exports)))
        } else {
          factory(createExporter(root))
        }
        function createExporter(exports, previous) {
          if (exports !== root) {
            if (typeof Object.create === 'function') {
              Object.defineProperty(exports, '__esModule', { value: true })
            } else {
              exports.__esModule = true
            }
          }
          return function (id, v) {
            return (exports[id] = previous ? previous(id, v) : v)
          }
        }
      })(function (exporter) {
        var extendStatics =
          Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array &&
            function (d, b) {
              d.__proto__ = b
            }) ||
          function (d, b) {
            for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]
          }

        __extends = function (d, b) {
          if (typeof b !== 'function' && b !== null)
            throw new TypeError(
              'Class extends value ' + String(b) + ' is not a constructor or null',
            )
          extendStatics(d, b)
          function __() {
            this.constructor = d
          }
          d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __())
        }

        __assign =
          Object.assign ||
          function (t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i]
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]
            }
            return t
          }

        __rest = function (s, e) {
          var t = {}
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p]
          if (s != null && typeof Object.getOwnPropertySymbols === 'function')
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
              if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]]
            }
          return t
        }

        __decorate = function (decorators, target, key, desc) {
          var c = arguments.length,
            r =
              c < 3
                ? target
                : desc === null
                ? (desc = Object.getOwnPropertyDescriptor(target, key))
                : desc,
            d
          if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
            r = Reflect.decorate(decorators, target, key, desc)
          else
            for (var i = decorators.length - 1; i >= 0; i--)
              if ((d = decorators[i]))
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
          return c > 3 && r && Object.defineProperty(target, key, r), r
        }

        __param = function (paramIndex, decorator) {
          return function (target, key) {
            decorator(target, key, paramIndex)
          }
        }

        __esDecorate = function (
          ctor,
          descriptorIn,
          decorators,
          contextIn,
          initializers,
          extraInitializers,
        ) {
          function accept(f) {
            if (f !== void 0 && typeof f !== 'function') throw new TypeError('Function expected')
            return f
          }
          var kind = contextIn.kind,
            key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value'
          var target = !descriptorIn && ctor ? (contextIn['static'] ? ctor : ctor.prototype) : null
          var descriptor =
            descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {})
          var _,
            done = false
          for (var i = decorators.length - 1; i >= 0; i--) {
            var context = {}
            for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p]
            for (var p in contextIn.access) context.access[p] = contextIn.access[p]
            context.addInitializer = function (f) {
              if (done)
                throw new TypeError('Cannot add initializers after decoration has completed')
              extraInitializers.push(accept(f || null))
            }
            var result = (0, decorators[i])(
              kind === 'accessor' ? { get: descriptor.get, set: descriptor.set } : descriptor[key],
              context,
            )
            if (kind === 'accessor') {
              if (result === void 0) continue
              if (result === null || typeof result !== 'object')
                throw new TypeError('Object expected')
              if ((_ = accept(result.get))) descriptor.get = _
              if ((_ = accept(result.set))) descriptor.set = _
              if ((_ = accept(result.init))) initializers.unshift(_)
            } else if ((_ = accept(result))) {
              if (kind === 'field') initializers.unshift(_)
              else descriptor[key] = _
            }
          }
          if (target) Object.defineProperty(target, contextIn.name, descriptor)
          done = true
        }

        __runInitializers = function (thisArg, initializers, value) {
          var useValue = arguments.length > 2
          for (var i = 0; i < initializers.length; i++) {
            value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg)
          }
          return useValue ? value : void 0
        }

        __propKey = function (x) {
          return typeof x === 'symbol' ? x : ''.concat(x)
        }

        __setFunctionName = function (f, name, prefix) {
          if (typeof name === 'symbol')
            name = name.description ? '['.concat(name.description, ']') : ''
          return Object.defineProperty(f, 'name', {
            configurable: true,
            value: prefix ? ''.concat(prefix, ' ', name) : name,
          })
        }

        __metadata = function (metadataKey, metadataValue) {
          if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
            return Reflect.metadata(metadataKey, metadataValue)
        }

        __awaiter = function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value)
                })
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value))
              } catch (e) {
                reject(e)
              }
            }
            function rejected(value) {
              try {
                step(generator['throw'](value))
              } catch (e) {
                reject(e)
              }
            }
            function step(result) {
              result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next())
          })
        }

        __generator = function (thisArg, body) {
          var _ = {
              label: 0,
              sent: function () {
                if (t[0] & 1) throw t[1]
                return t[1]
              },
              trys: [],
              ops: [],
            },
            f,
            y,
            t,
            g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype)
          return (
            (g.next = verb(0)),
            (g['throw'] = verb(1)),
            (g['return'] = verb(2)),
            typeof Symbol === 'function' &&
              (g[Symbol.iterator] = function () {
                return this
              }),
            g
          )
          function verb(n) {
            return function (v) {
              return step([n, v])
            }
          }
          function step(op) {
            if (f) throw new TypeError('Generator is already executing.')
            while ((g && ((g = 0), op[0] && (_ = 0)), _))
              try {
                if (
                  ((f = 1),
                  y &&
                    (t =
                      op[0] & 2
                        ? y['return']
                        : op[0]
                        ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                        : y.next) &&
                    !(t = t.call(y, op[1])).done)
                )
                  return t
                if (((y = 0), t)) op = [op[0] & 2, t.value]
                switch (op[0]) {
                  case 0:
                  case 1:
                    t = op
                    break
                  case 4:
                    _.label++
                    return { value: op[1], done: false }
                  case 5:
                    _.label++
                    y = op[1]
                    op = [0]
                    continue
                  case 7:
                    op = _.ops.pop()
                    _.trys.pop()
                    continue
                  default:
                    if (
                      !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                      (op[0] === 6 || op[0] === 2)
                    ) {
                      _ = 0
                      continue
                    }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                      _.label = op[1]
                      break
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                      _.label = t[1]
                      t = op
                      break
                    }
                    if (t && _.label < t[2]) {
                      _.label = t[2]
                      _.ops.push(op)
                      break
                    }
                    if (t[2]) _.ops.pop()
                    _.trys.pop()
                    continue
                }
                op = body.call(thisArg, _)
              } catch (e) {
                op = [6, e]
                y = 0
              } finally {
                f = t = 0
              }
            if (op[0] & 5) throw op[1]
            return { value: op[0] ? op[1] : void 0, done: true }
          }
        }

        __exportStar = function (m, o) {
          for (var p in m)
            if (p !== 'default' && !Object.prototype.hasOwnProperty.call(o, p))
              __createBinding(o, m, p)
        }

        __createBinding = Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              var desc = Object.getOwnPropertyDescriptor(m, k)
              if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                desc = {
                  enumerable: true,
                  get: function () {
                    return m[k]
                  },
                }
              }
              Object.defineProperty(o, k2, desc)
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              o[k2] = m[k]
            }

        __values = function (o) {
          var s = typeof Symbol === 'function' && Symbol.iterator,
            m = s && o[s],
            i = 0
          if (m) return m.call(o)
          if (o && typeof o.length === 'number')
            return {
              next: function () {
                if (o && i >= o.length) o = void 0
                return { value: o && o[i++], done: !o }
              },
            }
          throw new TypeError(s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.')
        }

        __read = function (o, n) {
          var m = typeof Symbol === 'function' && o[Symbol.iterator]
          if (!m) return o
          var i = m.call(o),
            r,
            ar = [],
            e
          try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value)
          } catch (error) {
            e = { error: error }
          } finally {
            try {
              if (r && !r.done && (m = i['return'])) m.call(i)
            } finally {
              if (e) throw e.error
            }
          }
          return ar
        }

        /** @deprecated */
        __spread = function () {
          for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]))
          return ar
        }

        /** @deprecated */
        __spreadArrays = function () {
          for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length
          for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j]
          return r
        }

        __spreadArray = function (to, from, pack) {
          if (pack || arguments.length === 2)
            for (var i = 0, l = from.length, ar; i < l; i++) {
              if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i)
                ar[i] = from[i]
              }
            }
          return to.concat(ar || Array.prototype.slice.call(from))
        }

        __await = function (v) {
          return this instanceof __await ? ((this.v = v), this) : new __await(v)
        }

        __asyncGenerator = function (thisArg, _arguments, generator) {
          if (!Symbol.asyncIterator) throw new TypeError('Symbol.asyncIterator is not defined.')
          var g = generator.apply(thisArg, _arguments || []),
            i,
            q = []
          return (
            (i = Object.create(
              (typeof AsyncIterator === 'function' ? AsyncIterator : Object).prototype,
            )),
            verb('next'),
            verb('throw'),
            verb('return', awaitReturn),
            (i[Symbol.asyncIterator] = function () {
              return this
            }),
            i
          )
          function awaitReturn(f) {
            return function (v) {
              return Promise.resolve(v).then(f, reject)
            }
          }
          function verb(n, f) {
            if (g[n]) {
              i[n] = function (v) {
                return new Promise(function (a, b) {
                  q.push([n, v, a, b]) > 1 || resume(n, v)
                })
              }
              if (f) i[n] = f(i[n])
            }
          }
          function resume(n, v) {
            try {
              step(g[n](v))
            } catch (e) {
              settle(q[0][3], e)
            }
          }
          function step(r) {
            r.value instanceof __await
              ? Promise.resolve(r.value.v).then(fulfill, reject)
              : settle(q[0][2], r)
          }
          function fulfill(value) {
            resume('next', value)
          }
          function reject(value) {
            resume('throw', value)
          }
          function settle(f, v) {
            if ((f(v), q.shift(), q.length)) resume(q[0][0], q[0][1])
          }
        }

        __asyncDelegator = function (o) {
          var i, p
          return (
            (i = {}),
            verb('next'),
            verb('throw', function (e) {
              throw e
            }),
            verb('return'),
            (i[Symbol.iterator] = function () {
              return this
            }),
            i
          )
          function verb(n, f) {
            i[n] = o[n]
              ? function (v) {
                  return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v
                }
              : f
          }
        }

        __asyncValues = function (o) {
          if (!Symbol.asyncIterator) throw new TypeError('Symbol.asyncIterator is not defined.')
          var m = o[Symbol.asyncIterator],
            i
          return m
            ? m.call(o)
            : ((o = typeof __values === 'function' ? __values(o) : o[Symbol.iterator]()),
              (i = {}),
              verb('next'),
              verb('throw'),
              verb('return'),
              (i[Symbol.asyncIterator] = function () {
                return this
              }),
              i)
          function verb(n) {
            i[n] =
              o[n] &&
              function (v) {
                return new Promise(function (resolve, reject) {
                  ;(v = o[n](v)), settle(resolve, reject, v.done, v.value)
                })
              }
          }
          function settle(resolve, reject, d, v) {
            Promise.resolve(v).then(function (v) {
              resolve({ value: v, done: d })
            }, reject)
          }
        }

        __makeTemplateObject = function (cooked, raw) {
          if (Object.defineProperty) {
            Object.defineProperty(cooked, 'raw', { value: raw })
          } else {
            cooked.raw = raw
          }
          return cooked
        }

        var __setModuleDefault = Object.create
          ? function (o, v) {
              Object.defineProperty(o, 'default', { enumerable: true, value: v })
            }
          : function (o, v) {
              o['default'] = v
            }

        var ownKeys = function (o) {
          ownKeys =
            Object.getOwnPropertyNames ||
            function (o) {
              var ar = []
              for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
              return ar
            }
          return ownKeys(o)
        }

        __importStar = function (mod) {
          if (mod && mod.__esModule) return mod
          var result = {}
          if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
              if (k[i] !== 'default') __createBinding(result, mod, k[i])
          __setModuleDefault(result, mod)
          return result
        }

        __importDefault = function (mod) {
          return mod && mod.__esModule ? mod : { default: mod }
        }

        __classPrivateFieldGet = function (receiver, state, kind, f) {
          if (kind === 'a' && !f)
            throw new TypeError('Private accessor was defined without a getter')
          if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError(
              'Cannot read private member from an object whose class did not declare it',
            )
          return kind === 'm'
            ? f
            : kind === 'a'
            ? f.call(receiver)
            : f
            ? f.value
            : state.get(receiver)
        }

        __classPrivateFieldSet = function (receiver, state, value, kind, f) {
          if (kind === 'm') throw new TypeError('Private method is not writable')
          if (kind === 'a' && !f)
            throw new TypeError('Private accessor was defined without a setter')
          if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError(
              'Cannot write private member to an object whose class did not declare it',
            )
          return (
            kind === 'a'
              ? f.call(receiver, value)
              : f
              ? (f.value = value)
              : state.set(receiver, value),
            value
          )
        }

        __classPrivateFieldIn = function (state, receiver) {
          if (receiver === null || (typeof receiver !== 'object' && typeof receiver !== 'function'))
            throw new TypeError("Cannot use 'in' operator on non-object")
          return typeof state === 'function' ? receiver === state : state.has(receiver)
        }

        __addDisposableResource = function (env, value, async) {
          if (value !== null && value !== void 0) {
            if (typeof value !== 'object' && typeof value !== 'function')
              throw new TypeError('Object expected.')
            var dispose, inner
            if (async) {
              if (!Symbol.asyncDispose) throw new TypeError('Symbol.asyncDispose is not defined.')
              dispose = value[Symbol.asyncDispose]
            }
            if (dispose === void 0) {
              if (!Symbol.dispose) throw new TypeError('Symbol.dispose is not defined.')
              dispose = value[Symbol.dispose]
              if (async) inner = dispose
            }
            if (typeof dispose !== 'function') throw new TypeError('Object not disposable.')
            if (inner)
              dispose = function () {
                try {
                  inner.call(this)
                } catch (e) {
                  return Promise.reject(e)
                }
              }
            env.stack.push({ value: value, dispose: dispose, async: async })
          } else if (async) {
            env.stack.push({ async: true })
          }
          return value
        }

        var _SuppressedError =
          typeof SuppressedError === 'function'
            ? SuppressedError
            : function (error, suppressed, message) {
                var e = new Error(message)
                return (
                  (e.name = 'SuppressedError'), (e.error = error), (e.suppressed = suppressed), e
                )
              }

        __disposeResources = function (env) {
          function fail(e) {
            env.error = env.hasError
              ? new _SuppressedError(e, env.error, 'An error was suppressed during disposal.')
              : e
            env.hasError = true
          }
          var r,
            s = 0
          function next() {
            while ((r = env.stack.pop())) {
              try {
                if (!r.async && s === 1)
                  return (s = 0), env.stack.push(r), Promise.resolve().then(next)
                if (r.dispose) {
                  var result = r.dispose.call(r.value)
                  if (r.async)
                    return (
                      (s |= 2),
                      Promise.resolve(result).then(next, function (e) {
                        fail(e)
                        return next()
                      })
                    )
                } else s |= 1
              } catch (e) {
                fail(e)
              }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve()
            if (env.hasError) throw env.error
          }
          return next()
        }

        __rewriteRelativeImportExtension = function (path, preserveJsx) {
          if (typeof path === 'string' && /^\.\.?\//.test(path)) {
            return path.replace(
              /\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i,
              function (m, tsx, d, ext, cm) {
                return tsx
                  ? preserveJsx
                    ? '.jsx'
                    : '.js'
                  : d && (!ext || !cm)
                  ? m
                  : d + ext + '.' + cm.toLowerCase() + 'js'
              },
            )
          }
          return path
        }

        exporter('__extends', __extends)
        exporter('__assign', __assign)
        exporter('__rest', __rest)
        exporter('__decorate', __decorate)
        exporter('__param', __param)
        exporter('__esDecorate', __esDecorate)
        exporter('__runInitializers', __runInitializers)
        exporter('__propKey', __propKey)
        exporter('__setFunctionName', __setFunctionName)
        exporter('__metadata', __metadata)
        exporter('__awaiter', __awaiter)
        exporter('__generator', __generator)
        exporter('__exportStar', __exportStar)
        exporter('__createBinding', __createBinding)
        exporter('__values', __values)
        exporter('__read', __read)
        exporter('__spread', __spread)
        exporter('__spreadArrays', __spreadArrays)
        exporter('__spreadArray', __spreadArray)
        exporter('__await', __await)
        exporter('__asyncGenerator', __asyncGenerator)
        exporter('__asyncDelegator', __asyncDelegator)
        exporter('__asyncValues', __asyncValues)
        exporter('__makeTemplateObject', __makeTemplateObject)
        exporter('__importStar', __importStar)
        exporter('__importDefault', __importDefault)
        exporter('__classPrivateFieldGet', __classPrivateFieldGet)
        exporter('__classPrivateFieldSet', __classPrivateFieldSet)
        exporter('__classPrivateFieldIn', __classPrivateFieldIn)
        exporter('__addDisposableResource', __addDisposableResource)
        exporter('__disposeResources', __disposeResources)
        exporter('__rewriteRelativeImportExtension', __rewriteRelativeImportExtension)
      })

      0 && 0

      /***/
    },

    /***/ 205: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
      'use strict'

      Object.defineProperty(exports, '__esModule', { value: true })
      const tslib_1 = __nccwpck_require__(313)
      tslib_1.__exportStar(__nccwpck_require__(94), exports)
      //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsb0RBQXlCIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogZnJvbSAnLi9wYXJzaW5nJ1xuIl19

      /***/
    },

    /***/ 565: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
      'use strict'

      Object.defineProperty(exports, '__esModule', { value: true })
      exports.BaseCSVParser = void 0
      const sync_1 = __nccwpck_require__(186)
      /**
       * Abstract base class for CSV parsers
       * Uses the csv-parse library for robust CSV parsing
       */
      class BaseCSVParser {
        constructor(config = {}) {
          this.config = { ...config }
        }
        /**
         * Helper method to parse CSV content as records with column headers
         */
        parseCSVRecords(csvContent, options) {
          const finalConfig = { ...this.config, ...options, columns: true }
          try {
            return (0, sync_1.parse)(csvContent, finalConfig)
          } catch (error) {
            throw new Error(`Error parsing CSV as records: ${error}`)
          }
        }
        /**
         * Helper method to parse CSV content as arrays
         */
        parseCSVArrays(csvContent, options) {
          const finalConfig = { ...this.config, ...options, columns: false }
          try {
            return (0, sync_1.parse)(csvContent, finalConfig)
          } catch (error) {
            throw new Error(`Error parsing CSV as arrays: ${error}`)
          }
        }
        /**
         * Convert a string value to a number and invalid values
         */
        convertToNumber(value) {
          if (!value || value.trim() === '') {
            throw new Error('Cannot convert empty or null value to number')
          }
          const numValue = parseFloat(value)
          if (isNaN(numValue)) {
            throw new Error(`Value "${value}" is not a valid number`)
          }
          return numValue
        }
      }
      exports.BaseCSVParser = BaseCSVParser
      //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGFyc2luZy9iYXNlLXBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5Q0FBK0M7QUFHL0M7OztHQUdHO0FBQ0gsTUFBc0IsYUFBYTtJQUdqQyxZQUFZLFNBQWtCLEVBQUU7UUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUE7SUFDN0IsQ0FBQztJQU9EOztPQUVHO0lBQ08sZUFBZSxDQUFDLFVBQWtCLEVBQUUsT0FBaUI7UUFDN0QsTUFBTSxXQUFXLEdBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFBO1FBRTFFLElBQUksQ0FBQztZQUNILE9BQU8sSUFBQSxZQUFLLEVBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBQ3ZDLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUMzRCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ08sY0FBYyxDQUFDLFVBQWtCLEVBQUUsT0FBaUI7UUFDNUQsTUFBTSxXQUFXLEdBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFBO1FBRTNFLElBQUksQ0FBQztZQUNILE9BQU8sSUFBQSxZQUFLLEVBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBQ3ZDLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUMxRCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ08sZUFBZSxDQUFDLEtBQWE7UUFDckMsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDbEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFBO1FBQ2pFLENBQUM7UUFDRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDbEMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLFVBQVUsS0FBSyx5QkFBeUIsQ0FBQyxDQUFBO1FBQzNELENBQUM7UUFDRCxPQUFPLFFBQVEsQ0FBQTtJQUNqQixDQUFDO0NBQ0Y7QUFuREQsc0NBbURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT3B0aW9ucywgcGFyc2UgfSBmcm9tICdjc3YtcGFyc2Uvc3luYydcbmltcG9ydCB7IENTVlBhcnNlciwgUGFyc2VkRGF0YSB9IGZyb20gJy4vaW50ZXJmYWNlcydcblxuLyoqXG4gKiBBYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBDU1YgcGFyc2Vyc1xuICogVXNlcyB0aGUgY3N2LXBhcnNlIGxpYnJhcnkgZm9yIHJvYnVzdCBDU1YgcGFyc2luZ1xuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZUNTVlBhcnNlcjxUIGV4dGVuZHMgUGFyc2VkRGF0YSA9IFBhcnNlZERhdGE+IGltcGxlbWVudHMgQ1NWUGFyc2VyPFQ+IHtcbiAgcHJvdGVjdGVkIGNvbmZpZzogT3B0aW9uc1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogT3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5jb25maWcgPSB7IC4uLmNvbmZpZyB9XG4gIH1cblxuICAvKipcbiAgICogQWJzdHJhY3QgbWV0aG9kIHRoYXQgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBjb25jcmV0ZSBjbGFzc2VzXG4gICAqL1xuICBhYnN0cmFjdCBwYXJzZShjc3ZDb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFQ+XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgdG8gcGFyc2UgQ1NWIGNvbnRlbnQgYXMgcmVjb3JkcyB3aXRoIGNvbHVtbiBoZWFkZXJzXG4gICAqL1xuICBwcm90ZWN0ZWQgcGFyc2VDU1ZSZWNvcmRzKGNzdkNvbnRlbnQ6IHN0cmluZywgb3B0aW9ucz86IE9wdGlvbnMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10ge1xuICAgIGNvbnN0IGZpbmFsQ29uZmlnOiBPcHRpb25zID0geyAuLi50aGlzLmNvbmZpZywgLi4ub3B0aW9ucywgY29sdW1uczogdHJ1ZSB9XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHBhcnNlKGNzdkNvbnRlbnQsIGZpbmFsQ29uZmlnKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHBhcnNpbmcgQ1NWIGFzIHJlY29yZHM6ICR7ZXJyb3J9YClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCB0byBwYXJzZSBDU1YgY29udGVudCBhcyBhcnJheXNcbiAgICovXG4gIHByb3RlY3RlZCBwYXJzZUNTVkFycmF5cyhjc3ZDb250ZW50OiBzdHJpbmcsIG9wdGlvbnM/OiBPcHRpb25zKTogc3RyaW5nW11bXSB7XG4gICAgY29uc3QgZmluYWxDb25maWc6IE9wdGlvbnMgPSB7IC4uLnRoaXMuY29uZmlnLCAuLi5vcHRpb25zLCBjb2x1bW5zOiBmYWxzZSB9XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHBhcnNlKGNzdkNvbnRlbnQsIGZpbmFsQ29uZmlnKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHBhcnNpbmcgQ1NWIGFzIGFycmF5czogJHtlcnJvcn1gKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGEgc3RyaW5nIHZhbHVlIHRvIGEgbnVtYmVyIGFuZCBpbnZhbGlkIHZhbHVlc1xuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnZlcnRUb051bWJlcih2YWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBpZiAoIXZhbHVlIHx8IHZhbHVlLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNvbnZlcnQgZW1wdHkgb3IgbnVsbCB2YWx1ZSB0byBudW1iZXInKVxuICAgIH1cbiAgICBjb25zdCBudW1WYWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpXG4gICAgaWYgKGlzTmFOKG51bVZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBWYWx1ZSBcIiR7dmFsdWV9XCIgaXMgbm90IGEgdmFsaWQgbnVtYmVyYClcbiAgICB9XG4gICAgcmV0dXJuIG51bVZhbHVlXG4gIH1cbn1cbiJdfQ==

      /***/
    },

    /***/ 656: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
      'use strict'

      Object.defineProperty(exports, '__esModule', { value: true })
      exports.CSVParserFactory = exports.instrumentToElementMap = void 0
      const ftse100_1 = __nccwpck_require__(771)
      const russell_1 = __nccwpck_require__(600)
      /**
       * Supported CSV parser types
       */
      exports.instrumentToElementMap = {
        Russell1000INDEX: 'Russell 1000® Index',
        Russell2000INDEX: 'Russell 2000® Index',
        Russell3000INDEX: 'Russell 3000® Index',
      }
      /**
       * Factory class for creating CSV parsers
       */
      class CSVParserFactory {
        /**
         * Auto-detect parser type based on instrument
         */
        static detectParserByInstrument(instrument) {
          switch (instrument) {
            case 'FTSE100INDEX':
              return new ftse100_1.FTSE100Parser()
            case 'Russell1000INDEX':
            case 'Russell2000INDEX':
            case 'Russell3000INDEX':
              return new russell_1.RussellDailyValuesParser(
                exports.instrumentToElementMap[instrument],
              )
            default:
              return null
          }
        }
      }
      exports.CSVParserFactory = CSVParserFactory
      //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXJzaW5nL2ZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdUNBQXlDO0FBQ3pDLHVDQUFvRDtBQUVwRDs7R0FFRztBQUNVLFFBQUEsc0JBQXNCLEdBQUc7SUFDcEMsZ0JBQWdCLEVBQUUscUJBQXFCO0lBQ3ZDLGdCQUFnQixFQUFFLHFCQUFxQjtJQUN2QyxnQkFBZ0IsRUFBRSxxQkFBcUI7Q0FDeEMsQ0FBQTtBQUVEOztHQUVHO0FBQ0gsTUFBYSxnQkFBZ0I7SUFDM0I7O09BRUc7SUFDSCxNQUFNLENBQUMsd0JBQXdCLENBQUMsVUFBa0I7UUFDaEQsUUFBUSxVQUFVLEVBQUUsQ0FBQztZQUNuQixLQUFLLGNBQWM7Z0JBQ2pCLE9BQU8sSUFBSSx1QkFBYSxFQUFFLENBQUE7WUFDNUIsS0FBSyxrQkFBa0IsQ0FBQztZQUN4QixLQUFLLGtCQUFrQixDQUFDO1lBQ3hCLEtBQUssa0JBQWtCO2dCQUNyQixPQUFPLElBQUksa0NBQXdCLENBQUMsOEJBQXNCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQTtZQUN6RTtnQkFDRSxPQUFPLElBQUksQ0FBQTtRQUNmLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFoQkQsNENBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1NWUGFyc2VyIH0gZnJvbSAnLi9pbnRlcmZhY2VzJ1xuaW1wb3J0IHsgRlRTRTEwMFBhcnNlciB9IGZyb20gJy4vZnRzZTEwMCdcbmltcG9ydCB7IFJ1c3NlbGxEYWlseVZhbHVlc1BhcnNlciB9IGZyb20gJy4vcnVzc2VsbCdcblxuLyoqXG4gKiBTdXBwb3J0ZWQgQ1NWIHBhcnNlciB0eXBlc1xuICovXG5leHBvcnQgY29uc3QgaW5zdHJ1bWVudFRvRWxlbWVudE1hcCA9IHtcbiAgUnVzc2VsbDEwMDBJTkRFWDogJ1J1c3NlbGwgMTAwMMKuIEluZGV4JyxcbiAgUnVzc2VsbDIwMDBJTkRFWDogJ1J1c3NlbGwgMjAwMMKuIEluZGV4JyxcbiAgUnVzc2VsbDMwMDBJTkRFWDogJ1J1c3NlbGwgMzAwMMKuIEluZGV4Jyxcbn1cblxuLyoqXG4gKiBGYWN0b3J5IGNsYXNzIGZvciBjcmVhdGluZyBDU1YgcGFyc2Vyc1xuICovXG5leHBvcnQgY2xhc3MgQ1NWUGFyc2VyRmFjdG9yeSB7XG4gIC8qKlxuICAgKiBBdXRvLWRldGVjdCBwYXJzZXIgdHlwZSBiYXNlZCBvbiBpbnN0cnVtZW50XG4gICAqL1xuICBzdGF0aWMgZGV0ZWN0UGFyc2VyQnlJbnN0cnVtZW50KGluc3RydW1lbnQ6IHN0cmluZyk6IENTVlBhcnNlciB8IG51bGwge1xuICAgIHN3aXRjaCAoaW5zdHJ1bWVudCkge1xuICAgICAgY2FzZSAnRlRTRTEwMElOREVYJzpcbiAgICAgICAgcmV0dXJuIG5ldyBGVFNFMTAwUGFyc2VyKClcbiAgICAgIGNhc2UgJ1J1c3NlbGwxMDAwSU5ERVgnOlxuICAgICAgY2FzZSAnUnVzc2VsbDIwMDBJTkRFWCc6XG4gICAgICBjYXNlICdSdXNzZWxsMzAwMElOREVYJzpcbiAgICAgICAgcmV0dXJuIG5ldyBSdXNzZWxsRGFpbHlWYWx1ZXNQYXJzZXIoaW5zdHJ1bWVudFRvRWxlbWVudE1hcFtpbnN0cnVtZW50XSlcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG59XG4iXX0=

      /***/
    },

    /***/ 771: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
      'use strict'

      Object.defineProperty(exports, '__esModule', { value: true })
      exports.FTSE100Parser = exports.HEADER_ROW_NUMBER = exports.EXPECTED_HEADERS = void 0
      const base_parser_1 = __nccwpck_require__(565)
      /**
       * Spreadsheet consts
       */
      const FTSE_100_INDEX_CODE = 'UKX'
      const FTSE_INDEX_CODE_COLUMN = 'Index Code'
      const FTSE_INDEX_SECTOR_NAME_COLUMN = 'Index/Sector Name'
      const FTSE_NUMBER_OF_CONSTITUENTS_COLUMN = 'Number of Constituents'
      const FTSE_INDEX_BASE_CURRENCY_COLUMN = 'Index Base Currency'
      const FTSE_GBP_INDEX_COLUMN = 'GBP Index'
      const HEADER_ROW_NUMBER = 4
      exports.HEADER_ROW_NUMBER = HEADER_ROW_NUMBER
      const EXPECTED_HEADERS = [
        FTSE_INDEX_CODE_COLUMN,
        FTSE_INDEX_SECTOR_NAME_COLUMN,
        FTSE_NUMBER_OF_CONSTITUENTS_COLUMN,
        FTSE_INDEX_BASE_CURRENCY_COLUMN,
        FTSE_GBP_INDEX_COLUMN,
      ]
      exports.EXPECTED_HEADERS = EXPECTED_HEADERS
      /**
       * CSV Parser for FTSE format
       * Expects columns: Index Code, Index/Sector Name, Number of Constituents, Index Base Currency, GBP Index
       */
      class FTSE100Parser extends base_parser_1.BaseCSVParser {
        constructor() {
          super({
            delimiter: ',',
            skip_empty_lines: true,
            trim: true,
            quote: '"',
            escape: '"',
            // We set this to true because on the last row there is a random element "XXXXXXXX"
            relax_column_count: true,
          })
        }
        async parse(csvContent) {
          const parsed = this.parseCSVRecords(csvContent, {
            from_line: HEADER_ROW_NUMBER,
          })
          const results = parsed
            .filter((row) => {
              return row[FTSE_INDEX_CODE_COLUMN] === FTSE_100_INDEX_CODE
            })
            .map((row) => this.createFTSE100Data(row))
          if (results.length > 1) {
            throw new Error('Multiple FTSE 100 index records found, expected only one')
          } else if (results.length === 0) {
            throw new Error('No FTSE 100 index record found')
          }
          return results[0]
        }
        /**
         * Creates FTSE100Data object from a CSV row
         */
        createFTSE100Data(row) {
          // Validate that all required elements are present in the row
          const emptyColumns = EXPECTED_HEADERS.filter((column) => {
            const value = row[column]
            return (
              value === null ||
              value === undefined ||
              (typeof value === 'string' && value.trim() === '')
            )
          })
          if (emptyColumns.length > 0) {
            throw new Error(
              `Empty or null values found in required columns: ${emptyColumns.join(', ')}`,
            )
          }
          return {
            indexCode: row[FTSE_INDEX_CODE_COLUMN],
            indexSectorName: row[FTSE_INDEX_SECTOR_NAME_COLUMN],
            numberOfConstituents: this.convertToNumber(row[FTSE_NUMBER_OF_CONSTITUENTS_COLUMN]),
            indexBaseCurrency: row[FTSE_INDEX_BASE_CURRENCY_COLUMN],
            gbpIndex: this.convertToNumber(row[FTSE_GBP_INDEX_COLUMN]),
          }
        }
      }
      exports.FTSE100Parser = FTSE100Parser
      //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnRzZTEwMC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXJzaW5nL2Z0c2UxMDAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0NBQTZDO0FBRzdDOztHQUVHO0FBQ0gsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUE7QUFDakMsTUFBTSxzQkFBc0IsR0FBRyxZQUFZLENBQUE7QUFDM0MsTUFBTSw2QkFBNkIsR0FBRyxtQkFBbUIsQ0FBQTtBQUN6RCxNQUFNLGtDQUFrQyxHQUFHLHdCQUF3QixDQUFBO0FBQ25FLE1BQU0sK0JBQStCLEdBQUcscUJBQXFCLENBQUE7QUFDN0QsTUFBTSxxQkFBcUIsR0FBRyxXQUFXLENBQUE7QUFDekMsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUE7QUFVQSw4Q0FBaUI7QUFSNUMsTUFBTSxnQkFBZ0IsR0FBRztJQUN2QixzQkFBc0I7SUFDdEIsNkJBQTZCO0lBQzdCLGtDQUFrQztJQUNsQywrQkFBK0I7SUFDL0IscUJBQXFCO0NBQ3RCLENBQUE7QUFFUSw0Q0FBZ0I7QUFjekI7OztHQUdHO0FBQ0gsTUFBYSxhQUFjLFNBQVEsMkJBQWE7SUFDOUM7UUFDRSxLQUFLLENBQUM7WUFDSixTQUFTLEVBQUUsR0FBRztZQUNkLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztZQUNWLE1BQU0sRUFBRSxHQUFHO1lBQ1gsbUZBQW1GO1lBQ25GLGtCQUFrQixFQUFFLElBQUk7U0FDekIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBa0I7UUFDNUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUU7WUFDOUMsU0FBUyxFQUFFLGlCQUFpQjtTQUM3QixDQUFDLENBQUE7UUFFRixNQUFNLE9BQU8sR0FBa0IsTUFBTTthQUNsQyxNQUFNLENBQUMsQ0FBQyxHQUEyQixFQUFFLEVBQUU7WUFDdEMsT0FBTyxHQUFHLENBQUMsc0JBQXNCLENBQUMsS0FBSyxtQkFBbUIsQ0FBQTtRQUM1RCxDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsQ0FBQyxHQUEyQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUVwRSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFBO1FBQzdFLENBQUM7YUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO1FBQ25ELENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSyxpQkFBaUIsQ0FBQyxHQUEyQjtRQUNuRCw2REFBNkQ7UUFDN0QsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDdEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3pCLE9BQU8sQ0FDTCxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUM1RixDQUFBO1FBQ0gsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDL0YsQ0FBQztRQUVELE9BQU87WUFDTCxTQUFTLEVBQUUsR0FBRyxDQUFDLHNCQUFzQixDQUFDO1lBQ3RDLGVBQWUsRUFBRSxHQUFHLENBQUMsNkJBQTZCLENBQUM7WUFDbkQsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQztZQUNuRixpQkFBaUIsRUFBRSxHQUFHLENBQUMsK0JBQStCLENBQUM7WUFDdkQsUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDM0QsQ0FBQTtJQUNILENBQUM7Q0FDRjtBQXpERCxzQ0F5REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlQ1NWUGFyc2VyIH0gZnJvbSAnLi9iYXNlLXBhcnNlcidcbmltcG9ydCB7IFBhcnNlZERhdGEgfSBmcm9tICcuL2ludGVyZmFjZXMnXG5cbi8qKlxuICogU3ByZWFkc2hlZXQgY29uc3RzXG4gKi9cbmNvbnN0IEZUU0VfMTAwX0lOREVYX0NPREUgPSAnVUtYJ1xuY29uc3QgRlRTRV9JTkRFWF9DT0RFX0NPTFVNTiA9ICdJbmRleCBDb2RlJ1xuY29uc3QgRlRTRV9JTkRFWF9TRUNUT1JfTkFNRV9DT0xVTU4gPSAnSW5kZXgvU2VjdG9yIE5hbWUnXG5jb25zdCBGVFNFX05VTUJFUl9PRl9DT05TVElUVUVOVFNfQ09MVU1OID0gJ051bWJlciBvZiBDb25zdGl0dWVudHMnXG5jb25zdCBGVFNFX0lOREVYX0JBU0VfQ1VSUkVOQ1lfQ09MVU1OID0gJ0luZGV4IEJhc2UgQ3VycmVuY3knXG5jb25zdCBGVFNFX0dCUF9JTkRFWF9DT0xVTU4gPSAnR0JQIEluZGV4J1xuY29uc3QgSEVBREVSX1JPV19OVU1CRVIgPSA0XG5cbmNvbnN0IEVYUEVDVEVEX0hFQURFUlMgPSBbXG4gIEZUU0VfSU5ERVhfQ09ERV9DT0xVTU4sXG4gIEZUU0VfSU5ERVhfU0VDVE9SX05BTUVfQ09MVU1OLFxuICBGVFNFX05VTUJFUl9PRl9DT05TVElUVUVOVFNfQ09MVU1OLFxuICBGVFNFX0lOREVYX0JBU0VfQ1VSUkVOQ1lfQ09MVU1OLFxuICBGVFNFX0dCUF9JTkRFWF9DT0xVTU4sXG5dXG5cbmV4cG9ydCB7IEVYUEVDVEVEX0hFQURFUlMsIEhFQURFUl9ST1dfTlVNQkVSIH1cblxuLyoqXG4gKiBTcGVjaWZpYyBkYXRhIHN0cnVjdHVyZSBmb3IgRlRTRSBkYXRhXG4gKiBCYXNlZCBvbiB0aGUgYWN0dWFsIEZUU0UgQ1NWIGZvcm1hdCB3aXRoIEluZGV4IENvZGUsIEluZGV4L1NlY3RvciBOYW1lLCBOdW1iZXIgb2YgQ29uc3RpdHVlbnRzLCBJbmRleCBCYXNlIEN1cnJlbmN5LCBhbmQgR0JQIEluZGV4XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRlRTRTEwMERhdGEgZXh0ZW5kcyBQYXJzZWREYXRhIHtcbiAgaW5kZXhDb2RlOiBzdHJpbmdcbiAgaW5kZXhTZWN0b3JOYW1lOiBzdHJpbmdcbiAgbnVtYmVyT2ZDb25zdGl0dWVudHM6IG51bWJlciB8IG51bGxcbiAgaW5kZXhCYXNlQ3VycmVuY3k6IHN0cmluZ1xuICBnYnBJbmRleDogbnVtYmVyIHwgbnVsbFxufVxuXG4vKipcbiAqIENTViBQYXJzZXIgZm9yIEZUU0UgZm9ybWF0XG4gKiBFeHBlY3RzIGNvbHVtbnM6IEluZGV4IENvZGUsIEluZGV4L1NlY3RvciBOYW1lLCBOdW1iZXIgb2YgQ29uc3RpdHVlbnRzLCBJbmRleCBCYXNlIEN1cnJlbmN5LCBHQlAgSW5kZXhcbiAqL1xuZXhwb3J0IGNsYXNzIEZUU0UxMDBQYXJzZXIgZXh0ZW5kcyBCYXNlQ1NWUGFyc2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoe1xuICAgICAgZGVsaW1pdGVyOiAnLCcsXG4gICAgICBza2lwX2VtcHR5X2xpbmVzOiB0cnVlLFxuICAgICAgdHJpbTogdHJ1ZSxcbiAgICAgIHF1b3RlOiAnXCInLFxuICAgICAgZXNjYXBlOiAnXCInLFxuICAgICAgLy8gV2Ugc2V0IHRoaXMgdG8gdHJ1ZSBiZWNhdXNlIG9uIHRoZSBsYXN0IHJvdyB0aGVyZSBpcyBhIHJhbmRvbSBlbGVtZW50IFwiWFhYWFhYWFhcIlxuICAgICAgcmVsYXhfY29sdW1uX2NvdW50OiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICBhc3luYyBwYXJzZShjc3ZDb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPEZUU0UxMDBEYXRhPiB7XG4gICAgY29uc3QgcGFyc2VkID0gdGhpcy5wYXJzZUNTVlJlY29yZHMoY3N2Q29udGVudCwge1xuICAgICAgZnJvbV9saW5lOiBIRUFERVJfUk9XX05VTUJFUixcbiAgICB9KVxuXG4gICAgY29uc3QgcmVzdWx0czogRlRTRTEwMERhdGFbXSA9IHBhcnNlZFxuICAgICAgLmZpbHRlcigocm93OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA9PiB7XG4gICAgICAgIHJldHVybiByb3dbRlRTRV9JTkRFWF9DT0RFX0NPTFVNTl0gPT09IEZUU0VfMTAwX0lOREVYX0NPREVcbiAgICAgIH0pXG4gICAgICAubWFwKChyb3c6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pID0+IHRoaXMuY3JlYXRlRlRTRTEwMERhdGEocm93KSlcblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTXVsdGlwbGUgRlRTRSAxMDAgaW5kZXggcmVjb3JkcyBmb3VuZCwgZXhwZWN0ZWQgb25seSBvbmUnKVxuICAgIH0gZWxzZSBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gRlRTRSAxMDAgaW5kZXggcmVjb3JkIGZvdW5kJylcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0c1swXVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgRlRTRTEwMERhdGEgb2JqZWN0IGZyb20gYSBDU1Ygcm93XG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUZUU0UxMDBEYXRhKHJvdzogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IEZUU0UxMDBEYXRhIHtcbiAgICAvLyBWYWxpZGF0ZSB0aGF0IGFsbCByZXF1aXJlZCBlbGVtZW50cyBhcmUgcHJlc2VudCBpbiB0aGUgcm93XG4gICAgY29uc3QgZW1wdHlDb2x1bW5zID0gRVhQRUNURURfSEVBREVSUy5maWx0ZXIoKGNvbHVtbikgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSByb3dbY29sdW1uXVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCB8fCAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZS50cmltKCkgPT09ICcnKVxuICAgICAgKVxuICAgIH0pXG5cbiAgICBpZiAoZW1wdHlDb2x1bW5zLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRW1wdHkgb3IgbnVsbCB2YWx1ZXMgZm91bmQgaW4gcmVxdWlyZWQgY29sdW1uczogJHtlbXB0eUNvbHVtbnMuam9pbignLCAnKX1gKVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBpbmRleENvZGU6IHJvd1tGVFNFX0lOREVYX0NPREVfQ09MVU1OXSxcbiAgICAgIGluZGV4U2VjdG9yTmFtZTogcm93W0ZUU0VfSU5ERVhfU0VDVE9SX05BTUVfQ09MVU1OXSxcbiAgICAgIG51bWJlck9mQ29uc3RpdHVlbnRzOiB0aGlzLmNvbnZlcnRUb051bWJlcihyb3dbRlRTRV9OVU1CRVJfT0ZfQ09OU1RJVFVFTlRTX0NPTFVNTl0pLFxuICAgICAgaW5kZXhCYXNlQ3VycmVuY3k6IHJvd1tGVFNFX0lOREVYX0JBU0VfQ1VSUkVOQ1lfQ09MVU1OXSxcbiAgICAgIGdicEluZGV4OiB0aGlzLmNvbnZlcnRUb051bWJlcihyb3dbRlRTRV9HQlBfSU5ERVhfQ09MVU1OXSksXG4gICAgfVxuICB9XG59XG4iXX0=

      /***/
    },

    /***/ 94: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
      'use strict'

      Object.defineProperty(exports, '__esModule', { value: true })
      exports.CSVParserFactory =
        exports.RussellDailyValuesParser =
        exports.FTSE100Parser =
        exports.BaseCSVParser =
          void 0
      var base_parser_1 = __nccwpck_require__(565)
      Object.defineProperty(exports, 'BaseCSVParser', {
        enumerable: true,
        get: function () {
          return base_parser_1.BaseCSVParser
        },
      })
      var ftse100_1 = __nccwpck_require__(771)
      Object.defineProperty(exports, 'FTSE100Parser', {
        enumerable: true,
        get: function () {
          return ftse100_1.FTSE100Parser
        },
      })
      var russell_1 = __nccwpck_require__(600)
      Object.defineProperty(exports, 'RussellDailyValuesParser', {
        enumerable: true,
        get: function () {
          return russell_1.RussellDailyValuesParser
        },
      })
      var factory_1 = __nccwpck_require__(656)
      Object.defineProperty(exports, 'CSVParserFactory', {
        enumerable: true,
        get: function () {
          return factory_1.CSVParserFactory
        },
      })
      //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGFyc2luZy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw2Q0FBNkM7QUFBcEMsNEdBQUEsYUFBYSxPQUFBO0FBQ3RCLHFDQUFzRDtBQUE3Qyx3R0FBQSxhQUFhLE9BQUE7QUFDdEIscUNBQTRFO0FBQW5FLG1IQUFBLHdCQUF3QixPQUFBO0FBQ2pDLHFDQUE0QztBQUFuQywyR0FBQSxnQkFBZ0IsT0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IENTVlBhcnNlciwgUGFyc2VkRGF0YSB9IGZyb20gJy4vaW50ZXJmYWNlcydcbmV4cG9ydCB7IEJhc2VDU1ZQYXJzZXIgfSBmcm9tICcuL2Jhc2UtcGFyc2VyJ1xuZXhwb3J0IHsgRlRTRTEwMFBhcnNlciwgRlRTRTEwMERhdGEgfSBmcm9tICcuL2Z0c2UxMDAnXG5leHBvcnQgeyBSdXNzZWxsRGFpbHlWYWx1ZXNQYXJzZXIsIFJ1c3NlbGxEYWlseVZhbHVlc0RhdGEgfSBmcm9tICcuL3J1c3NlbGwnXG5leHBvcnQgeyBDU1ZQYXJzZXJGYWN0b3J5IH0gZnJvbSAnLi9mYWN0b3J5J1xuIl19

      /***/
    },

    /***/ 600: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
      'use strict'

      Object.defineProperty(exports, '__esModule', { value: true })
      exports.RussellDailyValuesParser = void 0
      const base_parser_1 = __nccwpck_require__(565)
      // Column names for Russell CSV format
      // The first column contains the index names but doesn't have a consistent header
      // We'll use the first column (index 0) directly instead of relying on column names
      const HEADER_ROW_NUMBER = 6
      const INDEX_NAME_COLUMN = 0
      const CLOSE_VALUE_COLUMN = 4
      /**
       * CSV Parser for Russell Daily Values format
       * Only extracts indexName and close fields
       */
      class RussellDailyValuesParser extends base_parser_1.BaseCSVParser {
        constructor(instrument) {
          super({
            delimiter: ',',
            skip_empty_lines: true,
            trim: true,
            quote: '"',
            escape: '"',
            // Set this to true because the random XXXXXXXX in the last row
            relax_column_count: true,
          })
          this.instrument = instrument
        }
        async parse(csvContent) {
          this.validateCloseColumn(csvContent)
          const parsed = this.parseCSVArrays(csvContent, {
            from_line: HEADER_ROW_NUMBER + 1, // + 1 to start parsing after the header row
          })
          const results = parsed
            .filter((row) => {
              return row[INDEX_NAME_COLUMN] === this.instrument
            })
            .map((row) => this.createRussellData(row))
          if (results.length === 0) {
            throw new Error('No matching Russell index records found')
          } else if (results.length > 1) {
            throw new Error('Multiple matching Russell index records found, expected only one')
          }
          return results[0]
        }
        /**
         * Validates that the CLOSE_VALUE_COLUMN index corresponds to the "Close" header
         */
        validateCloseColumn(csvContent) {
          const parsed = this.parseCSVArrays(csvContent, {
            from_line: HEADER_ROW_NUMBER,
            to_line: HEADER_ROW_NUMBER,
          })
          if (parsed.length === 0) {
            throw new Error(
              `CSV content does not have enough lines to validate header row at line ${HEADER_ROW_NUMBER}`,
            )
          }
          const headerRow = parsed[0]
          if (headerRow.length <= CLOSE_VALUE_COLUMN) {
            throw new Error(
              `Header row does not have enough columns. Expected at least ${
                CLOSE_VALUE_COLUMN + 1
              } columns`,
            )
          }
          const closeHeader = headerRow[CLOSE_VALUE_COLUMN]
          if (closeHeader.toLowerCase() !== 'close') {
            throw new Error(
              `Expected "Close" column at index ${CLOSE_VALUE_COLUMN}, but found "${closeHeader}"`,
            )
          }
        }
        /**
         * Creates RussellDailyValuesData object from a CSV row array
         */
        createRussellData(row) {
          const indexName = row[INDEX_NAME_COLUMN]
          const closeValue = row[CLOSE_VALUE_COLUMN]
          if (
            closeValue === null ||
            closeValue === undefined ||
            (typeof closeValue === 'string' && closeValue.trim() === '')
          ) {
            throw new Error(`Empty values found in required columns: Close`)
          }
          return {
            indexName: indexName,
            close: this.convertToNumber(closeValue),
          }
        }
      }
      exports.RussellDailyValuesParser = RussellDailyValuesParser
      //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVzc2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXJzaW5nL3J1c3NlbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0NBQTZDO0FBRzdDLHNDQUFzQztBQUN0QyxpRkFBaUY7QUFDakYsbUZBQW1GO0FBQ25GLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFBO0FBQzNCLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFBO0FBQzNCLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFBO0FBVzVCOzs7R0FHRztBQUNILE1BQWEsd0JBQXlCLFNBQVEsMkJBQWE7SUFHekQsWUFBWSxVQUFrQjtRQUM1QixLQUFLLENBQUM7WUFDSixTQUFTLEVBQUUsR0FBRztZQUNkLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztZQUNWLE1BQU0sRUFBRSxHQUFHO1lBQ1gsK0RBQStEO1lBQy9ELGtCQUFrQixFQUFFLElBQUk7U0FDekIsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7SUFDOUIsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBa0I7UUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRXBDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFO1lBQzdDLFNBQVMsRUFBRSxpQkFBaUIsR0FBRyxDQUFDLEVBQUUsNENBQTRDO1NBQy9FLENBQUMsQ0FBQTtRQUVGLE1BQU0sT0FBTyxHQUE2QixNQUFNO2FBQzdDLE1BQU0sQ0FBQyxDQUFDLEdBQWEsRUFBRSxFQUFFO1lBQ3hCLE9BQU8sR0FBRyxDQUFDLGlCQUFpQixDQUFDLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQTtRQUNuRCxDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsQ0FBQyxHQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBRXRELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6QixNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUE7UUFDNUQsQ0FBQzthQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUE7UUFDckYsQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ25CLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLFVBQWtCO1FBQzVDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFO1lBQzdDLFNBQVMsRUFBRSxpQkFBaUI7WUFDNUIsT0FBTyxFQUFFLGlCQUFpQjtTQUMzQixDQUFDLENBQUE7UUFFRixJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FDYix5RUFBeUUsaUJBQWlCLEVBQUUsQ0FDN0YsQ0FBQTtRQUNILENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDM0IsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLGtCQUFrQixFQUFFLENBQUM7WUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FDYiw4REFDRSxrQkFBa0IsR0FBRyxDQUN2QixVQUFVLENBQ1gsQ0FBQTtRQUNILENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtRQUNqRCxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUMxQyxNQUFNLElBQUksS0FBSyxDQUNiLG9DQUFvQyxrQkFBa0IsZ0JBQWdCLFdBQVcsR0FBRyxDQUNyRixDQUFBO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNLLGlCQUFpQixDQUFDLEdBQWE7UUFDckMsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUE7UUFDeEMsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFFMUMsSUFDRSxVQUFVLEtBQUssSUFBSTtZQUNuQixVQUFVLEtBQUssU0FBUztZQUN4QixDQUFDLE9BQU8sVUFBVSxLQUFLLFFBQVEsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQzVELENBQUM7WUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUE7UUFDbEUsQ0FBQztRQUVELE9BQU87WUFDTCxTQUFTLEVBQUUsU0FBUztZQUNwQixLQUFLLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUM7U0FDeEMsQ0FBQTtJQUNILENBQUM7Q0FDRjtBQTFGRCw0REEwRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlQ1NWUGFyc2VyIH0gZnJvbSAnLi9iYXNlLXBhcnNlcidcbmltcG9ydCB7IFBhcnNlZERhdGEgfSBmcm9tICcuL2ludGVyZmFjZXMnXG5cbi8vIENvbHVtbiBuYW1lcyBmb3IgUnVzc2VsbCBDU1YgZm9ybWF0XG4vLyBUaGUgZmlyc3QgY29sdW1uIGNvbnRhaW5zIHRoZSBpbmRleCBuYW1lcyBidXQgZG9lc24ndCBoYXZlIGEgY29uc2lzdGVudCBoZWFkZXJcbi8vIFdlJ2xsIHVzZSB0aGUgZmlyc3QgY29sdW1uIChpbmRleCAwKSBkaXJlY3RseSBpbnN0ZWFkIG9mIHJlbHlpbmcgb24gY29sdW1uIG5hbWVzXG5jb25zdCBIRUFERVJfUk9XX05VTUJFUiA9IDZcbmNvbnN0IElOREVYX05BTUVfQ09MVU1OID0gMFxuY29uc3QgQ0xPU0VfVkFMVUVfQ09MVU1OID0gNFxuXG4vKipcbiAqIFNwZWNpZmljIGRhdGEgc3RydWN0dXJlIGZvciBSdXNzZWxsIERhaWx5IFZhbHVlcyBkYXRhXG4gKiBPbmx5IGluY2x1ZGVzIHRoZSBlc3NlbnRpYWwgZmllbGRzOiBpbmRleE5hbWUgYW5kIGNsb3NlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUnVzc2VsbERhaWx5VmFsdWVzRGF0YSBleHRlbmRzIFBhcnNlZERhdGEge1xuICBpbmRleE5hbWU6IHN0cmluZ1xuICBjbG9zZTogbnVtYmVyXG59XG5cbi8qKlxuICogQ1NWIFBhcnNlciBmb3IgUnVzc2VsbCBEYWlseSBWYWx1ZXMgZm9ybWF0XG4gKiBPbmx5IGV4dHJhY3RzIGluZGV4TmFtZSBhbmQgY2xvc2UgZmllbGRzXG4gKi9cbmV4cG9ydCBjbGFzcyBSdXNzZWxsRGFpbHlWYWx1ZXNQYXJzZXIgZXh0ZW5kcyBCYXNlQ1NWUGFyc2VyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBpbnN0cnVtZW50OiBzdHJpbmdcblxuICBjb25zdHJ1Y3RvcihpbnN0cnVtZW50OiBzdHJpbmcpIHtcbiAgICBzdXBlcih7XG4gICAgICBkZWxpbWl0ZXI6ICcsJyxcbiAgICAgIHNraXBfZW1wdHlfbGluZXM6IHRydWUsXG4gICAgICB0cmltOiB0cnVlLFxuICAgICAgcXVvdGU6ICdcIicsXG4gICAgICBlc2NhcGU6ICdcIicsXG4gICAgICAvLyBTZXQgdGhpcyB0byB0cnVlIGJlY2F1c2UgdGhlIHJhbmRvbSBYWFhYWFhYWCBpbiB0aGUgbGFzdCByb3dcbiAgICAgIHJlbGF4X2NvbHVtbl9jb3VudDogdHJ1ZSxcbiAgICB9KVxuICAgIHRoaXMuaW5zdHJ1bWVudCA9IGluc3RydW1lbnRcbiAgfVxuXG4gIGFzeW5jIHBhcnNlKGNzdkNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8UnVzc2VsbERhaWx5VmFsdWVzRGF0YT4ge1xuICAgIHRoaXMudmFsaWRhdGVDbG9zZUNvbHVtbihjc3ZDb250ZW50KVxuXG4gICAgY29uc3QgcGFyc2VkID0gdGhpcy5wYXJzZUNTVkFycmF5cyhjc3ZDb250ZW50LCB7XG4gICAgICBmcm9tX2xpbmU6IEhFQURFUl9ST1dfTlVNQkVSICsgMSwgLy8gKyAxIHRvIHN0YXJ0IHBhcnNpbmcgYWZ0ZXIgdGhlIGhlYWRlciByb3dcbiAgICB9KVxuXG4gICAgY29uc3QgcmVzdWx0czogUnVzc2VsbERhaWx5VmFsdWVzRGF0YVtdID0gcGFyc2VkXG4gICAgICAuZmlsdGVyKChyb3c6IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgIHJldHVybiByb3dbSU5ERVhfTkFNRV9DT0xVTU5dID09PSB0aGlzLmluc3RydW1lbnRcbiAgICAgIH0pXG4gICAgICAubWFwKChyb3c6IHN0cmluZ1tdKSA9PiB0aGlzLmNyZWF0ZVJ1c3NlbGxEYXRhKHJvdykpXG5cbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gbWF0Y2hpbmcgUnVzc2VsbCBpbmRleCByZWNvcmRzIGZvdW5kJylcbiAgICB9IGVsc2UgaWYgKHJlc3VsdHMubGVuZ3RoID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdWx0aXBsZSBtYXRjaGluZyBSdXNzZWxsIGluZGV4IHJlY29yZHMgZm91bmQsIGV4cGVjdGVkIG9ubHkgb25lJylcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0c1swXVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlcyB0aGF0IHRoZSBDTE9TRV9WQUxVRV9DT0xVTU4gaW5kZXggY29ycmVzcG9uZHMgdG8gdGhlIFwiQ2xvc2VcIiBoZWFkZXJcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVDbG9zZUNvbHVtbihjc3ZDb250ZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwYXJzZWQgPSB0aGlzLnBhcnNlQ1NWQXJyYXlzKGNzdkNvbnRlbnQsIHtcbiAgICAgIGZyb21fbGluZTogSEVBREVSX1JPV19OVU1CRVIsXG4gICAgICB0b19saW5lOiBIRUFERVJfUk9XX05VTUJFUixcbiAgICB9KVxuXG4gICAgaWYgKHBhcnNlZC5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENTViBjb250ZW50IGRvZXMgbm90IGhhdmUgZW5vdWdoIGxpbmVzIHRvIHZhbGlkYXRlIGhlYWRlciByb3cgYXQgbGluZSAke0hFQURFUl9ST1dfTlVNQkVSfWAsXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyUm93ID0gcGFyc2VkWzBdXG4gICAgaWYgKGhlYWRlclJvdy5sZW5ndGggPD0gQ0xPU0VfVkFMVUVfQ09MVU1OKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBIZWFkZXIgcm93IGRvZXMgbm90IGhhdmUgZW5vdWdoIGNvbHVtbnMuIEV4cGVjdGVkIGF0IGxlYXN0ICR7XG4gICAgICAgICAgQ0xPU0VfVkFMVUVfQ09MVU1OICsgMVxuICAgICAgICB9IGNvbHVtbnNgLFxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGNsb3NlSGVhZGVyID0gaGVhZGVyUm93W0NMT1NFX1ZBTFVFX0NPTFVNTl1cbiAgICBpZiAoY2xvc2VIZWFkZXIudG9Mb3dlckNhc2UoKSAhPT0gJ2Nsb3NlJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgXCJDbG9zZVwiIGNvbHVtbiBhdCBpbmRleCAke0NMT1NFX1ZBTFVFX0NPTFVNTn0sIGJ1dCBmb3VuZCBcIiR7Y2xvc2VIZWFkZXJ9XCJgLFxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFJ1c3NlbGxEYWlseVZhbHVlc0RhdGEgb2JqZWN0IGZyb20gYSBDU1Ygcm93IGFycmF5XG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVJ1c3NlbGxEYXRhKHJvdzogc3RyaW5nW10pOiBSdXNzZWxsRGFpbHlWYWx1ZXNEYXRhIHtcbiAgICBjb25zdCBpbmRleE5hbWUgPSByb3dbSU5ERVhfTkFNRV9DT0xVTU5dXG4gICAgY29uc3QgY2xvc2VWYWx1ZSA9IHJvd1tDTE9TRV9WQUxVRV9DT0xVTU5dXG5cbiAgICBpZiAoXG4gICAgICBjbG9zZVZhbHVlID09PSBudWxsIHx8XG4gICAgICBjbG9zZVZhbHVlID09PSB1bmRlZmluZWQgfHxcbiAgICAgICh0eXBlb2YgY2xvc2VWYWx1ZSA9PT0gJ3N0cmluZycgJiYgY2xvc2VWYWx1ZS50cmltKCkgPT09ICcnKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFbXB0eSB2YWx1ZXMgZm91bmQgaW4gcmVxdWlyZWQgY29sdW1uczogQ2xvc2VgKVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBpbmRleE5hbWU6IGluZGV4TmFtZSxcbiAgICAgIGNsb3NlOiB0aGlzLmNvbnZlcnRUb051bWJlcihjbG9zZVZhbHVlKSxcbiAgICB9XG4gIH1cbn1cbiJdfQ==

      /***/
    },

    /***/ 186: /***/ (__unused_webpack_module, exports) => {
      'use strict'

      class CsvError extends Error {
        constructor(code, message, options, ...contexts) {
          if (Array.isArray(message)) message = message.join(' ').trim()
          super(message)
          if (Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(this, CsvError)
          }
          this.code = code
          for (const context of contexts) {
            for (const key in context) {
              const value = context[key]
              this[key] = Buffer.isBuffer(value)
                ? value.toString(options.encoding)
                : value == null
                ? value
                : JSON.parse(JSON.stringify(value))
            }
          }
        }
      }

      const is_object = function (obj) {
        return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
      }

      const normalize_columns_array = function (columns) {
        const normalizedColumns = []
        for (let i = 0, l = columns.length; i < l; i++) {
          const column = columns[i]
          if (column === undefined || column === null || column === false) {
            normalizedColumns[i] = { disabled: true }
          } else if (typeof column === 'string') {
            normalizedColumns[i] = { name: column }
          } else if (is_object(column)) {
            if (typeof column.name !== 'string') {
              throw new CsvError('CSV_OPTION_COLUMNS_MISSING_NAME', [
                'Option columns missing name:',
                `property "name" is required at position ${i}`,
                'when column is an object literal',
              ])
            }
            normalizedColumns[i] = column
          } else {
            throw new CsvError('CSV_INVALID_COLUMN_DEFINITION', [
              'Invalid column definition:',
              'expect a string or a literal object,',
              `got ${JSON.stringify(column)} at position ${i}`,
            ])
          }
        }
        return normalizedColumns
      }

      class ResizeableBuffer {
        constructor(size = 100) {
          this.size = size
          this.length = 0
          this.buf = Buffer.allocUnsafe(size)
        }
        prepend(val) {
          if (Buffer.isBuffer(val)) {
            const length = this.length + val.length
            if (length >= this.size) {
              this.resize()
              if (length >= this.size) {
                throw Error('INVALID_BUFFER_STATE')
              }
            }
            const buf = this.buf
            this.buf = Buffer.allocUnsafe(this.size)
            val.copy(this.buf, 0)
            buf.copy(this.buf, val.length)
            this.length += val.length
          } else {
            const length = this.length++
            if (length === this.size) {
              this.resize()
            }
            const buf = this.clone()
            this.buf[0] = val
            buf.copy(this.buf, 1, 0, length)
          }
        }
        append(val) {
          const length = this.length++
          if (length === this.size) {
            this.resize()
          }
          this.buf[length] = val
        }
        clone() {
          return Buffer.from(this.buf.slice(0, this.length))
        }
        resize() {
          const length = this.length
          this.size = this.size * 2
          const buf = Buffer.allocUnsafe(this.size)
          this.buf.copy(buf, 0, 0, length)
          this.buf = buf
        }
        toString(encoding) {
          if (encoding) {
            return this.buf.slice(0, this.length).toString(encoding)
          } else {
            return Uint8Array.prototype.slice.call(this.buf.slice(0, this.length))
          }
        }
        toJSON() {
          return this.toString('utf8')
        }
        reset() {
          this.length = 0
        }
      }

      // white space characters
      // https://en.wikipedia.org/wiki/Whitespace_character
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Character_Classes#Types
      // \f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff
      const np = 12
      const cr$1 = 13 // `\r`, carriage return, 0x0D in hexadécimal, 13 in decimal
      const nl$1 = 10 // `\n`, newline, 0x0A in hexadecimal, 10 in decimal
      const space = 32
      const tab = 9

      const init_state = function (options) {
        return {
          bomSkipped: false,
          bufBytesStart: 0,
          castField: options.cast_function,
          commenting: false,
          // Current error encountered by a record
          error: undefined,
          enabled: options.from_line === 1,
          escaping: false,
          escapeIsQuote:
            Buffer.isBuffer(options.escape) &&
            Buffer.isBuffer(options.quote) &&
            Buffer.compare(options.escape, options.quote) === 0,
          // columns can be `false`, `true`, `Array`
          expectedRecordLength: Array.isArray(options.columns) ? options.columns.length : undefined,
          field: new ResizeableBuffer(20),
          firstLineToHeaders: options.cast_first_line_to_header,
          needMoreDataSize: Math.max(
            // Skip if the remaining buffer smaller than comment
            options.comment !== null ? options.comment.length : 0,
            // Skip if the remaining buffer can be delimiter
            ...options.delimiter.map((delimiter) => delimiter.length),
            // Skip if the remaining buffer can be escape sequence
            options.quote !== null ? options.quote.length : 0,
          ),
          previousBuf: undefined,
          quoting: false,
          stop: false,
          rawBuffer: new ResizeableBuffer(100),
          record: [],
          recordHasError: false,
          record_length: 0,
          recordDelimiterMaxLength:
            options.record_delimiter.length === 0
              ? 0
              : Math.max(...options.record_delimiter.map((v) => v.length)),
          trimChars: [
            Buffer.from(' ', options.encoding)[0],
            Buffer.from('\t', options.encoding)[0],
          ],
          wasQuoting: false,
          wasRowDelimiter: false,
          timchars: [
            Buffer.from(Buffer.from([cr$1], 'utf8').toString(), options.encoding),
            Buffer.from(Buffer.from([nl$1], 'utf8').toString(), options.encoding),
            Buffer.from(Buffer.from([np], 'utf8').toString(), options.encoding),
            Buffer.from(Buffer.from([space], 'utf8').toString(), options.encoding),
            Buffer.from(Buffer.from([tab], 'utf8').toString(), options.encoding),
          ],
        }
      }

      const underscore = function (str) {
        return str.replace(/([A-Z])/g, function (_, match) {
          return '_' + match.toLowerCase()
        })
      }

      const normalize_options = function (opts) {
        const options = {}
        // Merge with user options
        for (const opt in opts) {
          options[underscore(opt)] = opts[opt]
        }
        // Normalize option `encoding`
        // Note: defined first because other options depends on it
        // to convert chars/strings into buffers.
        if (options.encoding === undefined || options.encoding === true) {
          options.encoding = 'utf8'
        } else if (options.encoding === null || options.encoding === false) {
          options.encoding = null
        } else if (typeof options.encoding !== 'string' && options.encoding !== null) {
          throw new CsvError(
            'CSV_INVALID_OPTION_ENCODING',
            [
              'Invalid option encoding:',
              'encoding must be a string or null to return a buffer,',
              `got ${JSON.stringify(options.encoding)}`,
            ],
            options,
          )
        }
        // Normalize option `bom`
        if (options.bom === undefined || options.bom === null || options.bom === false) {
          options.bom = false
        } else if (options.bom !== true) {
          throw new CsvError(
            'CSV_INVALID_OPTION_BOM',
            ['Invalid option bom:', 'bom must be true,', `got ${JSON.stringify(options.bom)}`],
            options,
          )
        }
        // Normalize option `cast`
        options.cast_function = null
        if (
          options.cast === undefined ||
          options.cast === null ||
          options.cast === false ||
          options.cast === ''
        ) {
          options.cast = undefined
        } else if (typeof options.cast === 'function') {
          options.cast_function = options.cast
          options.cast = true
        } else if (options.cast !== true) {
          throw new CsvError(
            'CSV_INVALID_OPTION_CAST',
            [
              'Invalid option cast:',
              'cast must be true or a function,',
              `got ${JSON.stringify(options.cast)}`,
            ],
            options,
          )
        }
        // Normalize option `cast_date`
        if (
          options.cast_date === undefined ||
          options.cast_date === null ||
          options.cast_date === false ||
          options.cast_date === ''
        ) {
          options.cast_date = false
        } else if (options.cast_date === true) {
          options.cast_date = function (value) {
            const date = Date.parse(value)
            return !isNaN(date) ? new Date(date) : value
          }
        } else if (typeof options.cast_date !== 'function') {
          throw new CsvError(
            'CSV_INVALID_OPTION_CAST_DATE',
            [
              'Invalid option cast_date:',
              'cast_date must be true or a function,',
              `got ${JSON.stringify(options.cast_date)}`,
            ],
            options,
          )
        }
        // Normalize option `columns`
        options.cast_first_line_to_header = null
        if (options.columns === true) {
          // Fields in the first line are converted as-is to columns
          options.cast_first_line_to_header = undefined
        } else if (typeof options.columns === 'function') {
          options.cast_first_line_to_header = options.columns
          options.columns = true
        } else if (Array.isArray(options.columns)) {
          options.columns = normalize_columns_array(options.columns)
        } else if (
          options.columns === undefined ||
          options.columns === null ||
          options.columns === false
        ) {
          options.columns = false
        } else {
          throw new CsvError(
            'CSV_INVALID_OPTION_COLUMNS',
            [
              'Invalid option columns:',
              'expect an array, a function or true,',
              `got ${JSON.stringify(options.columns)}`,
            ],
            options,
          )
        }
        // Normalize option `group_columns_by_name`
        if (
          options.group_columns_by_name === undefined ||
          options.group_columns_by_name === null ||
          options.group_columns_by_name === false
        ) {
          options.group_columns_by_name = false
        } else if (options.group_columns_by_name !== true) {
          throw new CsvError(
            'CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME',
            [
              'Invalid option group_columns_by_name:',
              'expect an boolean,',
              `got ${JSON.stringify(options.group_columns_by_name)}`,
            ],
            options,
          )
        } else if (options.columns === false) {
          throw new CsvError(
            'CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME',
            ['Invalid option group_columns_by_name:', 'the `columns` mode must be activated.'],
            options,
          )
        }
        // Normalize option `comment`
        if (
          options.comment === undefined ||
          options.comment === null ||
          options.comment === false ||
          options.comment === ''
        ) {
          options.comment = null
        } else {
          if (typeof options.comment === 'string') {
            options.comment = Buffer.from(options.comment, options.encoding)
          }
          if (!Buffer.isBuffer(options.comment)) {
            throw new CsvError(
              'CSV_INVALID_OPTION_COMMENT',
              [
                'Invalid option comment:',
                'comment must be a buffer or a string,',
                `got ${JSON.stringify(options.comment)}`,
              ],
              options,
            )
          }
        }
        // Normalize option `comment_no_infix`
        if (
          options.comment_no_infix === undefined ||
          options.comment_no_infix === null ||
          options.comment_no_infix === false
        ) {
          options.comment_no_infix = false
        } else if (options.comment_no_infix !== true) {
          throw new CsvError(
            'CSV_INVALID_OPTION_COMMENT',
            [
              'Invalid option comment_no_infix:',
              'value must be a boolean,',
              `got ${JSON.stringify(options.comment_no_infix)}`,
            ],
            options,
          )
        }
        // Normalize option `delimiter`
        const delimiter_json = JSON.stringify(options.delimiter)
        if (!Array.isArray(options.delimiter)) options.delimiter = [options.delimiter]
        if (options.delimiter.length === 0) {
          throw new CsvError(
            'CSV_INVALID_OPTION_DELIMITER',
            [
              'Invalid option delimiter:',
              'delimiter must be a non empty string or buffer or array of string|buffer,',
              `got ${delimiter_json}`,
            ],
            options,
          )
        }
        options.delimiter = options.delimiter.map(function (delimiter) {
          if (delimiter === undefined || delimiter === null || delimiter === false) {
            return Buffer.from(',', options.encoding)
          }
          if (typeof delimiter === 'string') {
            delimiter = Buffer.from(delimiter, options.encoding)
          }
          if (!Buffer.isBuffer(delimiter) || delimiter.length === 0) {
            throw new CsvError(
              'CSV_INVALID_OPTION_DELIMITER',
              [
                'Invalid option delimiter:',
                'delimiter must be a non empty string or buffer or array of string|buffer,',
                `got ${delimiter_json}`,
              ],
              options,
            )
          }
          return delimiter
        })
        // Normalize option `escape`
        if (options.escape === undefined || options.escape === true) {
          options.escape = Buffer.from('"', options.encoding)
        } else if (typeof options.escape === 'string') {
          options.escape = Buffer.from(options.escape, options.encoding)
        } else if (options.escape === null || options.escape === false) {
          options.escape = null
        }
        if (options.escape !== null) {
          if (!Buffer.isBuffer(options.escape)) {
            throw new Error(
              `Invalid Option: escape must be a buffer, a string or a boolean, got ${JSON.stringify(
                options.escape,
              )}`,
            )
          }
        }
        // Normalize option `from`
        if (options.from === undefined || options.from === null) {
          options.from = 1
        } else {
          if (typeof options.from === 'string' && /\d+/.test(options.from)) {
            options.from = parseInt(options.from)
          }
          if (Number.isInteger(options.from)) {
            if (options.from < 0) {
              throw new Error(
                `Invalid Option: from must be a positive integer, got ${JSON.stringify(opts.from)}`,
              )
            }
          } else {
            throw new Error(
              `Invalid Option: from must be an integer, got ${JSON.stringify(options.from)}`,
            )
          }
        }
        // Normalize option `from_line`
        if (options.from_line === undefined || options.from_line === null) {
          options.from_line = 1
        } else {
          if (typeof options.from_line === 'string' && /\d+/.test(options.from_line)) {
            options.from_line = parseInt(options.from_line)
          }
          if (Number.isInteger(options.from_line)) {
            if (options.from_line <= 0) {
              throw new Error(
                `Invalid Option: from_line must be a positive integer greater than 0, got ${JSON.stringify(
                  opts.from_line,
                )}`,
              )
            }
          } else {
            throw new Error(
              `Invalid Option: from_line must be an integer, got ${JSON.stringify(opts.from_line)}`,
            )
          }
        }
        // Normalize options `ignore_last_delimiters`
        if (
          options.ignore_last_delimiters === undefined ||
          options.ignore_last_delimiters === null
        ) {
          options.ignore_last_delimiters = false
        } else if (typeof options.ignore_last_delimiters === 'number') {
          options.ignore_last_delimiters = Math.floor(options.ignore_last_delimiters)
          if (options.ignore_last_delimiters === 0) {
            options.ignore_last_delimiters = false
          }
        } else if (typeof options.ignore_last_delimiters !== 'boolean') {
          throw new CsvError(
            'CSV_INVALID_OPTION_IGNORE_LAST_DELIMITERS',
            [
              'Invalid option `ignore_last_delimiters`:',
              'the value must be a boolean value or an integer,',
              `got ${JSON.stringify(options.ignore_last_delimiters)}`,
            ],
            options,
          )
        }
        if (options.ignore_last_delimiters === true && options.columns === false) {
          throw new CsvError(
            'CSV_IGNORE_LAST_DELIMITERS_REQUIRES_COLUMNS',
            [
              'The option `ignore_last_delimiters`',
              'requires the activation of the `columns` option',
            ],
            options,
          )
        }
        // Normalize option `info`
        if (options.info === undefined || options.info === null || options.info === false) {
          options.info = false
        } else if (options.info !== true) {
          throw new Error(`Invalid Option: info must be true, got ${JSON.stringify(options.info)}`)
        }
        // Normalize option `max_record_size`
        if (
          options.max_record_size === undefined ||
          options.max_record_size === null ||
          options.max_record_size === false
        ) {
          options.max_record_size = 0
        } else if (Number.isInteger(options.max_record_size) && options.max_record_size >= 0);
        else if (
          typeof options.max_record_size === 'string' &&
          /\d+/.test(options.max_record_size)
        ) {
          options.max_record_size = parseInt(options.max_record_size)
        } else {
          throw new Error(
            `Invalid Option: max_record_size must be a positive integer, got ${JSON.stringify(
              options.max_record_size,
            )}`,
          )
        }
        // Normalize option `objname`
        if (
          options.objname === undefined ||
          options.objname === null ||
          options.objname === false
        ) {
          options.objname = undefined
        } else if (Buffer.isBuffer(options.objname)) {
          if (options.objname.length === 0) {
            throw new Error(`Invalid Option: objname must be a non empty buffer`)
          }
          if (options.encoding === null);
          else {
            options.objname = options.objname.toString(options.encoding)
          }
        } else if (typeof options.objname === 'string') {
          if (options.objname.length === 0) {
            throw new Error(`Invalid Option: objname must be a non empty string`)
          }
          // Great, nothing to do
        } else if (typeof options.objname === 'number');
        else {
          throw new Error(
            `Invalid Option: objname must be a string or a buffer, got ${options.objname}`,
          )
        }
        if (options.objname !== undefined) {
          if (typeof options.objname === 'number') {
            if (options.columns !== false) {
              throw Error(
                'Invalid Option: objname index cannot be combined with columns or be defined as a field',
              )
            }
          } else {
            // A string or a buffer
            if (options.columns === false) {
              throw Error(
                'Invalid Option: objname field must be combined with columns or be defined as an index',
              )
            }
          }
        }
        // Normalize option `on_record`
        if (options.on_record === undefined || options.on_record === null) {
          options.on_record = undefined
        } else if (typeof options.on_record !== 'function') {
          throw new CsvError(
            'CSV_INVALID_OPTION_ON_RECORD',
            [
              'Invalid option `on_record`:',
              'expect a function,',
              `got ${JSON.stringify(options.on_record)}`,
            ],
            options,
          )
        }
        // Normalize option `on_skip`
        // options.on_skip ??= (err, chunk) => {
        //   this.emit('skip', err, chunk);
        // };
        if (
          options.on_skip !== undefined &&
          options.on_skip !== null &&
          typeof options.on_skip !== 'function'
        ) {
          throw new Error(
            `Invalid Option: on_skip must be a function, got ${JSON.stringify(options.on_skip)}`,
          )
        }
        // Normalize option `quote`
        if (options.quote === null || options.quote === false || options.quote === '') {
          options.quote = null
        } else {
          if (options.quote === undefined || options.quote === true) {
            options.quote = Buffer.from('"', options.encoding)
          } else if (typeof options.quote === 'string') {
            options.quote = Buffer.from(options.quote, options.encoding)
          }
          if (!Buffer.isBuffer(options.quote)) {
            throw new Error(
              `Invalid Option: quote must be a buffer or a string, got ${JSON.stringify(
                options.quote,
              )}`,
            )
          }
        }
        // Normalize option `raw`
        if (options.raw === undefined || options.raw === null || options.raw === false) {
          options.raw = false
        } else if (options.raw !== true) {
          throw new Error(`Invalid Option: raw must be true, got ${JSON.stringify(options.raw)}`)
        }
        // Normalize option `record_delimiter`
        if (options.record_delimiter === undefined) {
          options.record_delimiter = []
        } else if (
          typeof options.record_delimiter === 'string' ||
          Buffer.isBuffer(options.record_delimiter)
        ) {
          if (options.record_delimiter.length === 0) {
            throw new CsvError(
              'CSV_INVALID_OPTION_RECORD_DELIMITER',
              [
                'Invalid option `record_delimiter`:',
                'value must be a non empty string or buffer,',
                `got ${JSON.stringify(options.record_delimiter)}`,
              ],
              options,
            )
          }
          options.record_delimiter = [options.record_delimiter]
        } else if (!Array.isArray(options.record_delimiter)) {
          throw new CsvError(
            'CSV_INVALID_OPTION_RECORD_DELIMITER',
            [
              'Invalid option `record_delimiter`:',
              'value must be a string, a buffer or array of string|buffer,',
              `got ${JSON.stringify(options.record_delimiter)}`,
            ],
            options,
          )
        }
        options.record_delimiter = options.record_delimiter.map(function (rd, i) {
          if (typeof rd !== 'string' && !Buffer.isBuffer(rd)) {
            throw new CsvError(
              'CSV_INVALID_OPTION_RECORD_DELIMITER',
              [
                'Invalid option `record_delimiter`:',
                'value must be a string, a buffer or array of string|buffer',
                `at index ${i},`,
                `got ${JSON.stringify(rd)}`,
              ],
              options,
            )
          } else if (rd.length === 0) {
            throw new CsvError(
              'CSV_INVALID_OPTION_RECORD_DELIMITER',
              [
                'Invalid option `record_delimiter`:',
                'value must be a non empty string or buffer',
                `at index ${i},`,
                `got ${JSON.stringify(rd)}`,
              ],
              options,
            )
          }
          if (typeof rd === 'string') {
            rd = Buffer.from(rd, options.encoding)
          }
          return rd
        })
        // Normalize option `relax_column_count`
        if (typeof options.relax_column_count === 'boolean');
        else if (options.relax_column_count === undefined || options.relax_column_count === null) {
          options.relax_column_count = false
        } else {
          throw new Error(
            `Invalid Option: relax_column_count must be a boolean, got ${JSON.stringify(
              options.relax_column_count,
            )}`,
          )
        }
        if (typeof options.relax_column_count_less === 'boolean');
        else if (
          options.relax_column_count_less === undefined ||
          options.relax_column_count_less === null
        ) {
          options.relax_column_count_less = false
        } else {
          throw new Error(
            `Invalid Option: relax_column_count_less must be a boolean, got ${JSON.stringify(
              options.relax_column_count_less,
            )}`,
          )
        }
        if (typeof options.relax_column_count_more === 'boolean');
        else if (
          options.relax_column_count_more === undefined ||
          options.relax_column_count_more === null
        ) {
          options.relax_column_count_more = false
        } else {
          throw new Error(
            `Invalid Option: relax_column_count_more must be a boolean, got ${JSON.stringify(
              options.relax_column_count_more,
            )}`,
          )
        }
        // Normalize option `relax_quotes`
        if (typeof options.relax_quotes === 'boolean');
        else if (options.relax_quotes === undefined || options.relax_quotes === null) {
          options.relax_quotes = false
        } else {
          throw new Error(
            `Invalid Option: relax_quotes must be a boolean, got ${JSON.stringify(
              options.relax_quotes,
            )}`,
          )
        }
        // Normalize option `skip_empty_lines`
        if (typeof options.skip_empty_lines === 'boolean');
        else if (options.skip_empty_lines === undefined || options.skip_empty_lines === null) {
          options.skip_empty_lines = false
        } else {
          throw new Error(
            `Invalid Option: skip_empty_lines must be a boolean, got ${JSON.stringify(
              options.skip_empty_lines,
            )}`,
          )
        }
        // Normalize option `skip_records_with_empty_values`
        if (typeof options.skip_records_with_empty_values === 'boolean');
        else if (
          options.skip_records_with_empty_values === undefined ||
          options.skip_records_with_empty_values === null
        ) {
          options.skip_records_with_empty_values = false
        } else {
          throw new Error(
            `Invalid Option: skip_records_with_empty_values must be a boolean, got ${JSON.stringify(
              options.skip_records_with_empty_values,
            )}`,
          )
        }
        // Normalize option `skip_records_with_error`
        if (typeof options.skip_records_with_error === 'boolean');
        else if (
          options.skip_records_with_error === undefined ||
          options.skip_records_with_error === null
        ) {
          options.skip_records_with_error = false
        } else {
          throw new Error(
            `Invalid Option: skip_records_with_error must be a boolean, got ${JSON.stringify(
              options.skip_records_with_error,
            )}`,
          )
        }
        // Normalize option `rtrim`
        if (options.rtrim === undefined || options.rtrim === null || options.rtrim === false) {
          options.rtrim = false
        } else if (options.rtrim !== true) {
          throw new Error(
            `Invalid Option: rtrim must be a boolean, got ${JSON.stringify(options.rtrim)}`,
          )
        }
        // Normalize option `ltrim`
        if (options.ltrim === undefined || options.ltrim === null || options.ltrim === false) {
          options.ltrim = false
        } else if (options.ltrim !== true) {
          throw new Error(
            `Invalid Option: ltrim must be a boolean, got ${JSON.stringify(options.ltrim)}`,
          )
        }
        // Normalize option `trim`
        if (options.trim === undefined || options.trim === null || options.trim === false) {
          options.trim = false
        } else if (options.trim !== true) {
          throw new Error(
            `Invalid Option: trim must be a boolean, got ${JSON.stringify(options.trim)}`,
          )
        }
        // Normalize options `trim`, `ltrim` and `rtrim`
        if (options.trim === true && opts.ltrim !== false) {
          options.ltrim = true
        } else if (options.ltrim !== true) {
          options.ltrim = false
        }
        if (options.trim === true && opts.rtrim !== false) {
          options.rtrim = true
        } else if (options.rtrim !== true) {
          options.rtrim = false
        }
        // Normalize option `to`
        if (options.to === undefined || options.to === null) {
          options.to = -1
        } else {
          if (typeof options.to === 'string' && /\d+/.test(options.to)) {
            options.to = parseInt(options.to)
          }
          if (Number.isInteger(options.to)) {
            if (options.to <= 0) {
              throw new Error(
                `Invalid Option: to must be a positive integer greater than 0, got ${JSON.stringify(
                  opts.to,
                )}`,
              )
            }
          } else {
            throw new Error(`Invalid Option: to must be an integer, got ${JSON.stringify(opts.to)}`)
          }
        }
        // Normalize option `to_line`
        if (options.to_line === undefined || options.to_line === null) {
          options.to_line = -1
        } else {
          if (typeof options.to_line === 'string' && /\d+/.test(options.to_line)) {
            options.to_line = parseInt(options.to_line)
          }
          if (Number.isInteger(options.to_line)) {
            if (options.to_line <= 0) {
              throw new Error(
                `Invalid Option: to_line must be a positive integer greater than 0, got ${JSON.stringify(
                  opts.to_line,
                )}`,
              )
            }
          } else {
            throw new Error(
              `Invalid Option: to_line must be an integer, got ${JSON.stringify(opts.to_line)}`,
            )
          }
        }
        return options
      }

      const isRecordEmpty = function (record) {
        return record.every(
          (field) => field == null || (field.toString && field.toString().trim() === ''),
        )
      }

      const cr = 13 // `\r`, carriage return, 0x0D in hexadécimal, 13 in decimal
      const nl = 10 // `\n`, newline, 0x0A in hexadecimal, 10 in decimal

      const boms = {
        // Note, the following are equals:
        // Buffer.from("\ufeff")
        // Buffer.from([239, 187, 191])
        // Buffer.from('EFBBBF', 'hex')
        utf8: Buffer.from([239, 187, 191]),
        // Note, the following are equals:
        // Buffer.from "\ufeff", 'utf16le
        // Buffer.from([255, 254])
        utf16le: Buffer.from([255, 254]),
      }

      const transform = function (original_options = {}) {
        const info = {
          bytes: 0,
          comment_lines: 0,
          empty_lines: 0,
          invalid_field_length: 0,
          lines: 1,
          records: 0,
        }
        const options = normalize_options(original_options)
        return {
          info: info,
          original_options: original_options,
          options: options,
          state: init_state(options),
          __needMoreData: function (i, bufLen, end) {
            if (end) return false
            const { encoding, escape, quote } = this.options
            const { quoting, needMoreDataSize, recordDelimiterMaxLength } = this.state
            const numOfCharLeft = bufLen - i - 1
            const requiredLength = Math.max(
              needMoreDataSize,
              // Skip if the remaining buffer smaller than record delimiter
              // If "record_delimiter" is yet to be discovered:
              // 1. It is equals to `[]` and "recordDelimiterMaxLength" equals `0`
              // 2. We set the length to windows line ending in the current encoding
              // Note, that encoding is known from user or bom discovery at that point
              // recordDelimiterMaxLength,
              recordDelimiterMaxLength === 0
                ? Buffer.from('\r\n', encoding).length
                : recordDelimiterMaxLength,
              // Skip if remaining buffer can be an escaped quote
              quoting ? (escape === null ? 0 : escape.length) + quote.length : 0,
              // Skip if remaining buffer can be record delimiter following the closing quote
              quoting ? quote.length + recordDelimiterMaxLength : 0,
            )
            return numOfCharLeft < requiredLength
          },
          // Central parser implementation
          parse: function (nextBuf, end, push, close) {
            const {
              bom,
              comment_no_infix,
              encoding,
              from_line,
              ltrim,
              max_record_size,
              raw,
              relax_quotes,
              rtrim,
              skip_empty_lines,
              to,
              to_line,
            } = this.options
            let { comment, escape, quote, record_delimiter } = this.options
            const { bomSkipped, previousBuf, rawBuffer, escapeIsQuote } = this.state
            let buf
            if (previousBuf === undefined) {
              if (nextBuf === undefined) {
                // Handle empty string
                close()
                return
              } else {
                buf = nextBuf
              }
            } else if (previousBuf !== undefined && nextBuf === undefined) {
              buf = previousBuf
            } else {
              buf = Buffer.concat([previousBuf, nextBuf])
            }
            // Handle UTF BOM
            if (bomSkipped === false) {
              if (bom === false) {
                this.state.bomSkipped = true
              } else if (buf.length < 3) {
                // No enough data
                if (end === false) {
                  // Wait for more data
                  this.state.previousBuf = buf
                  return
                }
              } else {
                for (const encoding in boms) {
                  if (boms[encoding].compare(buf, 0, boms[encoding].length) === 0) {
                    // Skip BOM
                    const bomLength = boms[encoding].length
                    this.state.bufBytesStart += bomLength
                    buf = buf.slice(bomLength)
                    // Renormalize original options with the new encoding
                    this.options = normalize_options({
                      ...this.original_options,
                      encoding: encoding,
                    })
                    // Options will re-evaluate the Buffer with the new encoding
                    ;({ comment, escape, quote } = this.options)
                    break
                  }
                }
                this.state.bomSkipped = true
              }
            }
            const bufLen = buf.length
            let pos
            for (pos = 0; pos < bufLen; pos++) {
              // Ensure we get enough space to look ahead
              // There should be a way to move this out of the loop
              if (this.__needMoreData(pos, bufLen, end)) {
                break
              }
              if (this.state.wasRowDelimiter === true) {
                this.info.lines++
                this.state.wasRowDelimiter = false
              }
              if (to_line !== -1 && this.info.lines > to_line) {
                this.state.stop = true
                close()
                return
              }
              // Auto discovery of record_delimiter, unix, mac and windows supported
              if (this.state.quoting === false && record_delimiter.length === 0) {
                const record_delimiterCount = this.__autoDiscoverRecordDelimiter(buf, pos)
                if (record_delimiterCount) {
                  record_delimiter = this.options.record_delimiter
                }
              }
              const chr = buf[pos]
              if (raw === true) {
                rawBuffer.append(chr)
              }
              if ((chr === cr || chr === nl) && this.state.wasRowDelimiter === false) {
                this.state.wasRowDelimiter = true
              }
              // Previous char was a valid escape char
              // treat the current char as a regular char
              if (this.state.escaping === true) {
                this.state.escaping = false
              } else {
                // Escape is only active inside quoted fields
                // We are quoting, the char is an escape chr and there is a chr to escape
                // if(escape !== null && this.state.quoting === true && chr === escape && pos + 1 < bufLen){
                if (
                  escape !== null &&
                  this.state.quoting === true &&
                  this.__isEscape(buf, pos, chr) &&
                  pos + escape.length < bufLen
                ) {
                  if (escapeIsQuote) {
                    if (this.__isQuote(buf, pos + escape.length)) {
                      this.state.escaping = true
                      pos += escape.length - 1
                      continue
                    }
                  } else {
                    this.state.escaping = true
                    pos += escape.length - 1
                    continue
                  }
                }
                // Not currently escaping and chr is a quote
                // TODO: need to compare bytes instead of single char
                if (this.state.commenting === false && this.__isQuote(buf, pos)) {
                  if (this.state.quoting === true) {
                    const nextChr = buf[pos + quote.length]
                    const isNextChrTrimable =
                      rtrim && this.__isCharTrimable(buf, pos + quote.length)
                    const isNextChrComment =
                      comment !== null &&
                      this.__compareBytes(comment, buf, pos + quote.length, nextChr)
                    const isNextChrDelimiter = this.__isDelimiter(buf, pos + quote.length, nextChr)
                    const isNextChrRecordDelimiter =
                      record_delimiter.length === 0
                        ? this.__autoDiscoverRecordDelimiter(buf, pos + quote.length)
                        : this.__isRecordDelimiter(nextChr, buf, pos + quote.length)
                    // Escape a quote
                    // Treat next char as a regular character
                    if (
                      escape !== null &&
                      this.__isEscape(buf, pos, chr) &&
                      this.__isQuote(buf, pos + escape.length)
                    ) {
                      pos += escape.length - 1
                    } else if (
                      !nextChr ||
                      isNextChrDelimiter ||
                      isNextChrRecordDelimiter ||
                      isNextChrComment ||
                      isNextChrTrimable
                    ) {
                      this.state.quoting = false
                      this.state.wasQuoting = true
                      pos += quote.length - 1
                      continue
                    } else if (relax_quotes === false) {
                      const err = this.__error(
                        new CsvError(
                          'CSV_INVALID_CLOSING_QUOTE',
                          [
                            'Invalid Closing Quote:',
                            `got "${String.fromCharCode(nextChr)}"`,
                            `at line ${this.info.lines}`,
                            'instead of delimiter, record delimiter, trimable character',
                            '(if activated) or comment',
                          ],
                          this.options,
                          this.__infoField(),
                        ),
                      )
                      if (err !== undefined) return err
                    } else {
                      this.state.quoting = false
                      this.state.wasQuoting = true
                      this.state.field.prepend(quote)
                      pos += quote.length - 1
                    }
                  } else {
                    if (this.state.field.length !== 0) {
                      // In relax_quotes mode, treat opening quote preceded by chrs as regular
                      if (relax_quotes === false) {
                        const info = this.__infoField()
                        const bom = Object.keys(boms)
                          .map((b) => (boms[b].equals(this.state.field.toString()) ? b : false))
                          .filter(Boolean)[0]
                        const err = this.__error(
                          new CsvError(
                            'INVALID_OPENING_QUOTE',
                            [
                              'Invalid Opening Quote:',
                              `a quote is found on field ${JSON.stringify(info.column)} at line ${
                                info.lines
                              }, value is ${JSON.stringify(this.state.field.toString(encoding))}`,
                              bom ? `(${bom} bom)` : undefined,
                            ],
                            this.options,
                            info,
                            {
                              field: this.state.field,
                            },
                          ),
                        )
                        if (err !== undefined) return err
                      }
                    } else {
                      this.state.quoting = true
                      pos += quote.length - 1
                      continue
                    }
                  }
                }
                if (this.state.quoting === false) {
                  const recordDelimiterLength = this.__isRecordDelimiter(chr, buf, pos)
                  if (recordDelimiterLength !== 0) {
                    // Do not emit comments which take a full line
                    const skipCommentLine =
                      this.state.commenting &&
                      this.state.wasQuoting === false &&
                      this.state.record.length === 0 &&
                      this.state.field.length === 0
                    if (skipCommentLine) {
                      this.info.comment_lines++
                      // Skip full comment line
                    } else {
                      // Activate records emition if above from_line
                      if (
                        this.state.enabled === false &&
                        this.info.lines + (this.state.wasRowDelimiter === true ? 1 : 0) >= from_line
                      ) {
                        this.state.enabled = true
                        this.__resetField()
                        this.__resetRecord()
                        pos += recordDelimiterLength - 1
                        continue
                      }
                      // Skip if line is empty and skip_empty_lines activated
                      if (
                        skip_empty_lines === true &&
                        this.state.wasQuoting === false &&
                        this.state.record.length === 0 &&
                        this.state.field.length === 0
                      ) {
                        this.info.empty_lines++
                        pos += recordDelimiterLength - 1
                        continue
                      }
                      this.info.bytes = this.state.bufBytesStart + pos
                      const errField = this.__onField()
                      if (errField !== undefined) return errField
                      this.info.bytes = this.state.bufBytesStart + pos + recordDelimiterLength
                      const errRecord = this.__onRecord(push)
                      if (errRecord !== undefined) return errRecord
                      if (to !== -1 && this.info.records >= to) {
                        this.state.stop = true
                        close()
                        return
                      }
                    }
                    this.state.commenting = false
                    pos += recordDelimiterLength - 1
                    continue
                  }
                  if (this.state.commenting) {
                    continue
                  }
                  if (
                    comment !== null &&
                    (comment_no_infix === false ||
                      (this.state.record.length === 0 && this.state.field.length === 0))
                  ) {
                    const commentCount = this.__compareBytes(comment, buf, pos, chr)
                    if (commentCount !== 0) {
                      this.state.commenting = true
                      continue
                    }
                  }
                  const delimiterLength = this.__isDelimiter(buf, pos, chr)
                  if (delimiterLength !== 0) {
                    this.info.bytes = this.state.bufBytesStart + pos
                    const errField = this.__onField()
                    if (errField !== undefined) return errField
                    pos += delimiterLength - 1
                    continue
                  }
                }
              }
              if (this.state.commenting === false) {
                if (
                  max_record_size !== 0 &&
                  this.state.record_length + this.state.field.length > max_record_size
                ) {
                  return this.__error(
                    new CsvError(
                      'CSV_MAX_RECORD_SIZE',
                      [
                        'Max Record Size:',
                        'record exceed the maximum number of tolerated bytes',
                        `of ${max_record_size}`,
                        `at line ${this.info.lines}`,
                      ],
                      this.options,
                      this.__infoField(),
                    ),
                  )
                }
              }
              const lappend =
                ltrim === false ||
                this.state.quoting === true ||
                this.state.field.length !== 0 ||
                !this.__isCharTrimable(buf, pos)
              // rtrim in non quoting is handle in __onField
              const rappend = rtrim === false || this.state.wasQuoting === false
              if (lappend === true && rappend === true) {
                this.state.field.append(chr)
              } else if (rtrim === true && !this.__isCharTrimable(buf, pos)) {
                return this.__error(
                  new CsvError(
                    'CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE',
                    [
                      'Invalid Closing Quote:',
                      'found non trimable byte after quote',
                      `at line ${this.info.lines}`,
                    ],
                    this.options,
                    this.__infoField(),
                  ),
                )
              } else {
                if (lappend === false) {
                  pos += this.__isCharTrimable(buf, pos) - 1
                }
                continue
              }
            }
            if (end === true) {
              // Ensure we are not ending in a quoting state
              if (this.state.quoting === true) {
                const err = this.__error(
                  new CsvError(
                    'CSV_QUOTE_NOT_CLOSED',
                    [
                      'Quote Not Closed:',
                      `the parsing is finished with an opening quote at line ${this.info.lines}`,
                    ],
                    this.options,
                    this.__infoField(),
                  ),
                )
                if (err !== undefined) return err
              } else {
                // Skip last line if it has no characters
                if (
                  this.state.wasQuoting === true ||
                  this.state.record.length !== 0 ||
                  this.state.field.length !== 0
                ) {
                  this.info.bytes = this.state.bufBytesStart + pos
                  const errField = this.__onField()
                  if (errField !== undefined) return errField
                  const errRecord = this.__onRecord(push)
                  if (errRecord !== undefined) return errRecord
                } else if (this.state.wasRowDelimiter === true) {
                  this.info.empty_lines++
                } else if (this.state.commenting === true) {
                  this.info.comment_lines++
                }
              }
            } else {
              this.state.bufBytesStart += pos
              this.state.previousBuf = buf.slice(pos)
            }
            if (this.state.wasRowDelimiter === true) {
              this.info.lines++
              this.state.wasRowDelimiter = false
            }
          },
          __onRecord: function (push) {
            const {
              columns,
              group_columns_by_name,
              encoding,
              info,
              from,
              relax_column_count,
              relax_column_count_less,
              relax_column_count_more,
              raw,
              skip_records_with_empty_values,
            } = this.options
            const { enabled, record } = this.state
            if (enabled === false) {
              return this.__resetRecord()
            }
            // Convert the first line into column names
            const recordLength = record.length
            if (columns === true) {
              if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
                this.__resetRecord()
                return
              }
              return this.__firstLineToColumns(record)
            }
            if (columns === false && this.info.records === 0) {
              this.state.expectedRecordLength = recordLength
            }
            if (recordLength !== this.state.expectedRecordLength) {
              const err =
                columns === false
                  ? new CsvError(
                      'CSV_RECORD_INCONSISTENT_FIELDS_LENGTH',
                      [
                        'Invalid Record Length:',
                        `expect ${this.state.expectedRecordLength},`,
                        `got ${recordLength} on line ${this.info.lines}`,
                      ],
                      this.options,
                      this.__infoField(),
                      {
                        record: record,
                      },
                    )
                  : new CsvError(
                      'CSV_RECORD_INCONSISTENT_COLUMNS',
                      [
                        'Invalid Record Length:',
                        `columns length is ${columns.length},`, // rename columns
                        `got ${recordLength} on line ${this.info.lines}`,
                      ],
                      this.options,
                      this.__infoField(),
                      {
                        record: record,
                      },
                    )
              if (
                relax_column_count === true ||
                (relax_column_count_less === true &&
                  recordLength < this.state.expectedRecordLength) ||
                (relax_column_count_more === true && recordLength > this.state.expectedRecordLength)
              ) {
                this.info.invalid_field_length++
                this.state.error = err
                // Error is undefined with skip_records_with_error
              } else {
                const finalErr = this.__error(err)
                if (finalErr) return finalErr
              }
            }
            if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
              this.__resetRecord()
              return
            }
            if (this.state.recordHasError === true) {
              this.__resetRecord()
              this.state.recordHasError = false
              return
            }
            this.info.records++
            if (from === 1 || this.info.records >= from) {
              const { objname } = this.options
              // With columns, records are object
              if (columns !== false) {
                const obj = {}
                // Transform record array to an object
                for (let i = 0, l = record.length; i < l; i++) {
                  if (columns[i] === undefined || columns[i].disabled) continue
                  // Turn duplicate columns into an array
                  if (group_columns_by_name === true && obj[columns[i].name] !== undefined) {
                    if (Array.isArray(obj[columns[i].name])) {
                      obj[columns[i].name] = obj[columns[i].name].concat(record[i])
                    } else {
                      obj[columns[i].name] = [obj[columns[i].name], record[i]]
                    }
                  } else {
                    obj[columns[i].name] = record[i]
                  }
                }
                // Without objname (default)
                if (raw === true || info === true) {
                  const extRecord = Object.assign(
                    { record: obj },
                    raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
                    info === true ? { info: this.__infoRecord() } : {},
                  )
                  const err = this.__push(
                    objname === undefined ? extRecord : [obj[objname], extRecord],
                    push,
                  )
                  if (err) {
                    return err
                  }
                } else {
                  const err = this.__push(objname === undefined ? obj : [obj[objname], obj], push)
                  if (err) {
                    return err
                  }
                }
                // Without columns, records are array
              } else {
                if (raw === true || info === true) {
                  const extRecord = Object.assign(
                    { record: record },
                    raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
                    info === true ? { info: this.__infoRecord() } : {},
                  )
                  const err = this.__push(
                    objname === undefined ? extRecord : [record[objname], extRecord],
                    push,
                  )
                  if (err) {
                    return err
                  }
                } else {
                  const err = this.__push(
                    objname === undefined ? record : [record[objname], record],
                    push,
                  )
                  if (err) {
                    return err
                  }
                }
              }
            }
            this.__resetRecord()
          },
          __firstLineToColumns: function (record) {
            const { firstLineToHeaders } = this.state
            try {
              const headers =
                firstLineToHeaders === undefined ? record : firstLineToHeaders.call(null, record)
              if (!Array.isArray(headers)) {
                return this.__error(
                  new CsvError(
                    'CSV_INVALID_COLUMN_MAPPING',
                    [
                      'Invalid Column Mapping:',
                      'expect an array from column function,',
                      `got ${JSON.stringify(headers)}`,
                    ],
                    this.options,
                    this.__infoField(),
                    {
                      headers: headers,
                    },
                  ),
                )
              }
              const normalizedHeaders = normalize_columns_array(headers)
              this.state.expectedRecordLength = normalizedHeaders.length
              this.options.columns = normalizedHeaders
              this.__resetRecord()
              return
            } catch (err) {
              return err
            }
          },
          __resetRecord: function () {
            if (this.options.raw === true) {
              this.state.rawBuffer.reset()
            }
            this.state.error = undefined
            this.state.record = []
            this.state.record_length = 0
          },
          __onField: function () {
            const { cast, encoding, rtrim, max_record_size } = this.options
            const { enabled, wasQuoting } = this.state
            // Short circuit for the from_line options
            if (enabled === false) {
              return this.__resetField()
            }
            let field = this.state.field.toString(encoding)
            if (rtrim === true && wasQuoting === false) {
              field = field.trimRight()
            }
            if (cast === true) {
              const [err, f] = this.__cast(field)
              if (err !== undefined) return err
              field = f
            }
            this.state.record.push(field)
            // Increment record length if record size must not exceed a limit
            if (max_record_size !== 0 && typeof field === 'string') {
              this.state.record_length += field.length
            }
            this.__resetField()
          },
          __resetField: function () {
            this.state.field.reset()
            this.state.wasQuoting = false
          },
          __push: function (record, push) {
            const { on_record } = this.options
            if (on_record !== undefined) {
              const info = this.__infoRecord()
              try {
                record = on_record.call(null, record, info)
              } catch (err) {
                return err
              }
              if (record === undefined || record === null) {
                return
              }
            }
            push(record)
          },
          // Return a tuple with the error and the casted value
          __cast: function (field) {
            const { columns, relax_column_count } = this.options
            const isColumns = Array.isArray(columns)
            // Dont loose time calling cast
            // because the final record is an object
            // and this field can't be associated to a key present in columns
            if (
              isColumns === true &&
              relax_column_count &&
              this.options.columns.length <= this.state.record.length
            ) {
              return [undefined, undefined]
            }
            if (this.state.castField !== null) {
              try {
                const info = this.__infoField()
                return [undefined, this.state.castField.call(null, field, info)]
              } catch (err) {
                return [err]
              }
            }
            if (this.__isFloat(field)) {
              return [undefined, parseFloat(field)]
            } else if (this.options.cast_date !== false) {
              const info = this.__infoField()
              return [undefined, this.options.cast_date.call(null, field, info)]
            }
            return [undefined, field]
          },
          // Helper to test if a character is a space or a line delimiter
          __isCharTrimable: function (buf, pos) {
            const isTrim = (buf, pos) => {
              const { timchars } = this.state
              loop1: for (let i = 0; i < timchars.length; i++) {
                const timchar = timchars[i]
                for (let j = 0; j < timchar.length; j++) {
                  if (timchar[j] !== buf[pos + j]) continue loop1
                }
                return timchar.length
              }
              return 0
            }
            return isTrim(buf, pos)
          },
          // Keep it in case we implement the `cast_int` option
          // __isInt(value){
          //   // return Number.isInteger(parseInt(value))
          //   // return !isNaN( parseInt( obj ) );
          //   return /^(\-|\+)?[1-9][0-9]*$/.test(value)
          // }
          __isFloat: function (value) {
            return value - parseFloat(value) + 1 >= 0 // Borrowed from jquery
          },
          __compareBytes: function (sourceBuf, targetBuf, targetPos, firstByte) {
            if (sourceBuf[0] !== firstByte) return 0
            const sourceLength = sourceBuf.length
            for (let i = 1; i < sourceLength; i++) {
              if (sourceBuf[i] !== targetBuf[targetPos + i]) return 0
            }
            return sourceLength
          },
          __isDelimiter: function (buf, pos, chr) {
            const { delimiter, ignore_last_delimiters } = this.options
            if (
              ignore_last_delimiters === true &&
              this.state.record.length === this.options.columns.length - 1
            ) {
              return 0
            } else if (
              ignore_last_delimiters !== false &&
              typeof ignore_last_delimiters === 'number' &&
              this.state.record.length === ignore_last_delimiters - 1
            ) {
              return 0
            }
            loop1: for (let i = 0; i < delimiter.length; i++) {
              const del = delimiter[i]
              if (del[0] === chr) {
                for (let j = 1; j < del.length; j++) {
                  if (del[j] !== buf[pos + j]) continue loop1
                }
                return del.length
              }
            }
            return 0
          },
          __isRecordDelimiter: function (chr, buf, pos) {
            const { record_delimiter } = this.options
            const recordDelimiterLength = record_delimiter.length
            loop1: for (let i = 0; i < recordDelimiterLength; i++) {
              const rd = record_delimiter[i]
              const rdLength = rd.length
              if (rd[0] !== chr) {
                continue
              }
              for (let j = 1; j < rdLength; j++) {
                if (rd[j] !== buf[pos + j]) {
                  continue loop1
                }
              }
              return rd.length
            }
            return 0
          },
          __isEscape: function (buf, pos, chr) {
            const { escape } = this.options
            if (escape === null) return false
            const l = escape.length
            if (escape[0] === chr) {
              for (let i = 0; i < l; i++) {
                if (escape[i] !== buf[pos + i]) {
                  return false
                }
              }
              return true
            }
            return false
          },
          __isQuote: function (buf, pos) {
            const { quote } = this.options
            if (quote === null) return false
            const l = quote.length
            for (let i = 0; i < l; i++) {
              if (quote[i] !== buf[pos + i]) {
                return false
              }
            }
            return true
          },
          __autoDiscoverRecordDelimiter: function (buf, pos) {
            const { encoding } = this.options
            // Note, we don't need to cache this information in state,
            // It is only called on the first line until we find out a suitable
            // record delimiter.
            const rds = [
              // Important, the windows line ending must be before mac os 9
              Buffer.from('\r\n', encoding),
              Buffer.from('\n', encoding),
              Buffer.from('\r', encoding),
            ]
            loop: for (let i = 0; i < rds.length; i++) {
              const l = rds[i].length
              for (let j = 0; j < l; j++) {
                if (rds[i][j] !== buf[pos + j]) {
                  continue loop
                }
              }
              this.options.record_delimiter.push(rds[i])
              this.state.recordDelimiterMaxLength = rds[i].length
              return rds[i].length
            }
            return 0
          },
          __error: function (msg) {
            const { encoding, raw, skip_records_with_error } = this.options
            const err = typeof msg === 'string' ? new Error(msg) : msg
            if (skip_records_with_error) {
              this.state.recordHasError = true
              if (this.options.on_skip !== undefined) {
                this.options.on_skip(err, raw ? this.state.rawBuffer.toString(encoding) : undefined)
              }
              // this.emit('skip', err, raw ? this.state.rawBuffer.toString(encoding) : undefined);
              return undefined
            } else {
              return err
            }
          },
          __infoDataSet: function () {
            return {
              ...this.info,
              columns: this.options.columns,
            }
          },
          __infoRecord: function () {
            const { columns, raw, encoding } = this.options
            return {
              ...this.__infoDataSet(),
              error: this.state.error,
              header: columns === true,
              index: this.state.record.length,
              raw: raw ? this.state.rawBuffer.toString(encoding) : undefined,
            }
          },
          __infoField: function () {
            const { columns } = this.options
            const isColumns = Array.isArray(columns)
            return {
              ...this.__infoRecord(),
              column:
                isColumns === true
                  ? columns.length > this.state.record.length
                    ? columns[this.state.record.length].name
                    : null
                  : this.state.record.length,
              quoting: this.state.wasQuoting,
            }
          },
        }
      }

      const parse = function (data, opts = {}) {
        if (typeof data === 'string') {
          data = Buffer.from(data)
        }
        const records = opts && opts.objname ? {} : []
        const parser = transform(opts)
        const push = (record) => {
          if (parser.options.objname === undefined) records.push(record)
          else {
            records[record[0]] = record[1]
          }
        }
        const close = () => {}
        const err1 = parser.parse(data, false, push, close)
        if (err1 !== undefined) throw err1
        const err2 = parser.parse(undefined, true, push, close)
        if (err2 !== undefined) throw err2
        return records
      }

      exports.CsvError = CsvError
      exports.parse = parse

      /***/
    },

    /******/
  }
  /************************************************************************/
  /******/ // The module cache
  /******/ var __webpack_module_cache__ = {}
  /******/
  /******/ // The require function
  /******/ function __nccwpck_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId]
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports
      /******/
    }
    /******/ // Create a new module (and put it into the cache)
    /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    })
    /******/
    /******/ // Execute the module function
    /******/ var threw = true
    /******/ try {
      /******/ __webpack_modules__[moduleId](module, module.exports, __nccwpck_require__)
      /******/ threw = false
      /******/
    } finally {
      /******/ if (threw) delete __webpack_module_cache__[moduleId]
      /******/
    }
    /******/
    /******/ // Return the exports of the module
    /******/ return module.exports
    /******/
  }
  /******/
  /************************************************************************/
  /******/ /* webpack/runtime/compat */
  /******/
  /******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + '/'
  /******/
  /************************************************************************/
  /******/
  /******/ // startup
  /******/ // Load entry module and return exports
  /******/ // This entry module is referenced by other modules so it can't be inlined
  /******/ var __webpack_exports__ = __nccwpck_require__(205)
  /******/ module.exports = __webpack_exports__
  /******/
  /******/
})()
