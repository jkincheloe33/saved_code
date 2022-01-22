import { useEffect, useRef } from 'react'
import create from 'zustand'

const portalInitialState = {
  location: null,
  termsVerified: false,
}

const initialState = {
  isReady: false,
  lang: 'en',
  hasNewLessons: false,
  portalState: { ...portalInitialState },
}

export const store = create(set => ({
  ...initialState,
  set: props => set(() => props),
  reset: () => set({ ...initialState, portalState: { ...portalInitialState }, user: null }),
}))

store.subscribe(
  state => {
    localStorage.setItem('state', JSON.stringify(state))
  },
  // eslint-disable-next-line no-unused-vars
  ({ isReady, set, reset, ...state }) => state
)

export const useStore = validateCallback => {
  const { set, ...state } = store(state => state)
  const ref = useRef(false)

  useEffect(() => {
    const jsonState = localStorage.getItem('state')
    const data = JSON.parse(jsonState || '{}')
    set({ ...data, isReady: true })
  }, [set])

  useEffect(() => {
    if (state.isReady && !ref.current) {
      if (validateCallback) validateCallback(state)
      ref.current = true
    }
  }, [state, validateCallback])

  return [set, state]
}
