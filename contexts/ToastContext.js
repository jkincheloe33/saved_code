import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const ToastContext = createContext({})

export const ToastProvider = ({ children }) => {
  const [showToast, setShowToast] = useState(false)
  const [toastData, setToastData] = useState(null)

  const handleShowToast = bool => {
    if (bool) setShowToast(true)
    else {
      setShowToast(false)
      // Wait for the toast to close before removing the data...JK
      setTimeout(() => setToastData(null), 150)
    }
  }

  // Close toast after 5 seconds if it's still open...PS & JK
  useEffect(() => {
    if (toastData) {
      handleShowToast(true)
      setTimeout(() => handleShowToast(false), 5000)
    }
  }, [toastData])

  return <ToastContext.Provider value={{ handleShowToast, setToastData, showToast, toastData }}>{children}</ToastContext.Provider>
}

ToastProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useToastContext = () => useContext(ToastContext)
