import { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

const SpacingContext = createContext({})

export const SpacingProvider = ({ children }) => {
  const [footerHeight, setFooterHeight] = useState(0)
  const [innerHeaderHeight, setInnerHeaderHeight] = useState(0)
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0)

  return (
    <SpacingContext.Provider
      value={{ footerHeight, innerHeaderHeight, mobileHeaderHeight, setFooterHeight, setInnerHeaderHeight, setMobileHeaderHeight }}
    >
      {children}
    </SpacingContext.Provider>
  )
}

SpacingProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useSpacingContext = () => useContext(SpacingContext)
