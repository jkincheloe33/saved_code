import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

/**
 * Delays your callback by 250ms or time specified and prevents it from being called multiple times within that timeframe...JC & JK
 *
 * @param {Function} callback function passed in
 * @param {Array} listeners  array of listeners to pass into the useEffect
 */

export const useCallbackDelay = (callback = () => {}, listeners = [], delay = 350) => {
  useEffect(() => {
    // Delays your callback by ${delay}ms...JC
    const timer = setTimeout(callback, delay)

    // cleanup method runs when this hook is called again within ${delay}ms.
    // this prevents your callback from firing consecutively within that timeframe...JC & JK
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, listeners)
}

/**
 * Interval hook
 *
 * @param {function} callback logic passed into hook
 * @param {number} delay  amount of time you want to pass before each interval
 */

export const useInterval = (callback, delay) => {
  const savedCallback = useRef()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    const id = setInterval(() => {
      savedCallback.current()
    }, delay)
    return () => clearInterval(id)
  }, [delay])
}

/**
 * Prefetch the given page
 *
 * @param {string} nextUrl  The path to a page inside the pages directory
 * @param {string} as  Optional decorator for url, used to prefetch dynamic routes. Defaults to url
 */

export const usePrefetch = (nextUrl, as) => {
  const router = useRouter()
  if (!as) as = nextUrl

  useEffect(() => {
    router.prefetch(`${nextUrl}`, `${as}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [as, nextUrl])
}

/**
 * Get the previous props or state
 *
 * @param {*} value  The value to track previous props/state of
 */

export const usePrevious = value => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}
