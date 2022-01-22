import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Lesson, Lessons } from '@components'
import { useLessonsContext } from '@contexts'
import { coreApi } from '@services'

const TIMING = 500

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all ${TIMING}ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

const Wrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
`

const LESSONS = {
  LIST: 1,
  SINGLE: 2,
}

const LessonsWorkflow = ({ handleBack }) => {
  const [active, setActive] = useState(LESSONS.LIST)
  const [activeLesson, setActiveLesson] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)

  const { lessonId, setLessonId } = useLessonsContext()

  // gets the initial list of lessons and refetches when active === 1 in order to get the updated lessonProgress step...JK
  useEffect(() => {
    const getLessons = async () => {
      const {
        data: { lessons, success },
      } = await coreApi.get('/onboarding/getLessons')
      if (success) setLessons(lessons)
      setLoading(false)
    }
    if (active === 1) getLessons()
  }, [active])

  // set active lesson from query params if it exists...JK
  useEffect(() => {
    if (lessonId) {
      const filtered = lessons.find(l => l.id === Number(lessonId))

      if (filtered) {
        setActiveLesson(filtered)
        setActive(LESSONS.SINGLE)
        setLessonId(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, lessons])

  const lessonsData = {
    handleBack,
    lessons,
    loading,
    setActiveLesson,
  }

  const lessonData = {
    activeLesson,
    handleBack: () => {
      setActive(LESSONS.LIST)
      // timeout needed to let animation complete before removing a lesson from the DOM...JK
      setTimeout(() => {
        setActiveLesson(null)
      }, TIMING)
    },
  }

  const components = [
    {
      Component: Lessons,
      data: lessonsData,
    },
    {
      Component: activeLesson && Lesson,
      data: lessonData,
    },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && <Component {...data} active={active} cta={{ onClick: handleBack, text: 'Close' }} setActive={setActive} />}
        </Container>
      ))}
    </Wrapper>
  )
}

LessonsWorkflow.propTypes = {
  handleBack: PropTypes.func,
}

export default LessonsWorkflow
