import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'

import { useAuthContext } from '@contexts'

const LessonsContext = createContext({})

export const LessonsProvider = ({ children }) => {
  const [lessonId, setLessonId] = useState(null)
  const [showLessons, setShowLessons] = useState(false)

  const { isAuthenticated } = useAuthContext()
  const { pathname, query, replace } = useRouter()

  useEffect(() => {
    if (isAuthenticated && query?.showLessons) {
      setShowLessons(true)
      if (query?.lessonId) setLessonId(query.lessonId)

      replace(pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, query])

  return <LessonsContext.Provider value={{ lessonId, setLessonId, setShowLessons, showLessons }}>{children}</LessonsContext.Provider>
}

LessonsProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useLessonsContext = () => useContext(LessonsContext)
