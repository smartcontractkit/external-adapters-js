import { rootReducer } from './reducer'
import { rootEpic } from './side-effects'
import { configureStore } from './store'
export * as actions from './actions'
export { store }

const { epicMiddleware, store } = configureStore(rootReducer)
epicMiddleware.run(rootEpic)
