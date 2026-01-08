import { KalmanSmoother } from './kalmanSmoother'

const kalmanSmoother = new KalmanSmoother()

export const processUpdate = (
  asset: string,
  rawPrice: bigint,
  spread: bigint,
  secondsFromTransition: number,
): {
  price: bigint
  x: bigint
  p: bigint
} => {
  return kalmanSmoother.processUpdate(asset, rawPrice, spread, secondsFromTransition)
}
