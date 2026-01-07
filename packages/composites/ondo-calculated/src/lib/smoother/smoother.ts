import { KalmanSmoother } from './kalmanSmoother'

const kalmanSmoother = new KalmanSmoother()

export const processUpdate = (
  rawPrice: bigint,
  spread: bigint,
  secondsFromTransition: number,
): {
  price: bigint
  x: bigint
  p: bigint
} => {
  return kalmanSmoother.processUpdate(rawPrice, spread, secondsFromTransition)
}
