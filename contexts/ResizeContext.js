import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const ResizeContext = createContext({})

export const ResizeProvider = ({ children }) => {
  const [windowHeight, setWindowHeight] = useState(0)
  const [windowWidth, setWindowWidth] = useState(0)

  const handleResize = () => {
    setWindowHeight(window.innerHeight)
    setWindowWidth(window.innerWidth)
  }

  useEffect(() => {
    if (window) handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <ResizeContext.Provider value={{ windowHeight, windowWidth, setWindowHeight, setWindowWidth }}>{children}</ResizeContext.Provider>
}

ResizeProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useResizeContext = () => useContext(ResizeContext)
