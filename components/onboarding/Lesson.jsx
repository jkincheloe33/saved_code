import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'
import gfm from 'remark-gfm'

import { CarouselArrow, colors, devices, shadows } from '@assets'
import { DynamicContainer, Image, Layout, Loader, PillButton, Text, Title as TitleBase } from '@components'
import { useCelebrationContext } from '@contexts'

import { coreApi } from '@services'

const ARROW_RATIO = 40

const Arrow = styled.div`
  align-items: center;
  background: ${colors.white};
  border: 1px solid ${colors.gray3}20;
  border-radius: 50%;
  box-shadow: ${shadows.card};
  cursor: pointer;
  display: flex;
  height: ${ARROW_RATIO}px;
  justify-content: center;
  opacity: ${p => (p.hide ? 0 : 1)};
  pointer-events: ${p => (p.hide ? 'none' : 'auto')};
  right: ${p => (p.back ? 'auto' : '10px')};
  transform: ${p => (p.back ? 'rotate(180deg)' : '')};
  transform-origin: center center;
  transition: all 500ms ease;
  width: ${ARROW_RATIO}px;

  &:hover {
    transform: scale(1.2) ${p => (p.back ? 'rotate(180deg)' : '')};
  }
`

const Body = styled(Text)`
  padding-bottom: 20px;

  @media (${devices.largeDesktop}) {
    font-size: 18px;
  }
`

const Content = styled.div`
  padding-bottom: 45px;

  @media (${devices.desktop}) {
    flex: 0 0 55%;
    padding-left: 67px;
    width: 55%;
  }
`

const Footer = styled.div`
  align-items: center;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  left: 0;
  padding: 0 25px 30px;
  position: fixed;
  width: 100%;

  @media (${devices.desktop}) {
    left: 50%;
    transform: translateX(-50%);
    width: 235px;
  }
`

const Item = styled(DynamicContainer)`
  align-items: center;
  display: flex;
  flex: 0 0 100%;
  flex-direction: column;
  padding: 30px 35px;
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;

  @media (${devices.desktop}) {
    flex-direction: row;
    padding: 45px;
  }
`

const Media = styled(Image)`
  object-fit: contain;
  width: 100%;

  @media (${devices.desktop}) {
    flex: 0 0 45%;
    width: 45%;
  }
`

const Title = styled(TitleBase)`
  padding: 20px 0 40px;

  @media (${devices.largeDesktop}) {
    font-size: 30px;
  }
`

const Wrapper = styled.div`
  background-color: ${colors.white};
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  position: relative;
  width: 100%;
`

const Lesson = ({ activeLesson, cta, handleBack }) => {
  const [activeStep, setActiveStep] = useState(activeLesson.step === 0 ? 1 : activeLesson.step)
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState([])

  const { setCelebration } = useCelebrationContext()

  // gets the list of steps based on the activeLesson id...JK
  useEffect(() => {
    const getSteps = async () => {
      const {
        data: { steps, success },
      } = await coreApi.get(`/onboarding/getLessonSteps?id=${activeLesson.id}`)
      if (success) setSteps(steps)
      setLoading(false)
    }
    getSteps()
  }, [activeLesson])

  // updates the lessonProgress step as the user changes pages, and sets completedAt if a user reaches the final page...JK
  useEffect(() => {
    const setLessonProgress = async () => {
      const {
        data: { completedChallenges, rewardProgress, success },
      } = await coreApi.post('/onboarding/setLessonProgress', { id: activeLesson.id, step: activeStep })
      if (success) {
        setCelebration({ completeChallenges: completedChallenges, rewardProgress })
      }
    }
    setLessonProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson.id, activeStep])

  return (
    <Layout cta={cta} dark full handleBack={handleBack} id='wambi-lesson' inner noFooter title={`Lessons | ${activeLesson.title}`}>
      {loading ? (
        <Loader />
      ) : (
        <Wrapper>
          {steps.length > 0 &&
            steps.map(({ actionConfig, content, image, title }, i) => (
              <Item active={activeStep} key={i}>
                <Media alt='Lesson Image' src={image ?? activeLesson.image} />
                <Content>
                  {title && (
                    <Title fontSize='22px' fontWeight={400} justifyContent='flex-start'>
                      {title}
                    </Title>
                  )}
                  {content && (
                    <Body color='gray1' noClamp>
                      <ReactMarkdown remarkPlugins={[gfm]}>{content}</ReactMarkdown>
                    </Body>
                  )}
                  {actionConfig?.text && <PillButton link={actionConfig.link} text={actionConfig.text} small />}
                </Content>
              </Item>
            ))}
          <Footer>
            <Arrow back hide={activeStep === 1} id='lesson-back-arrow' onClick={() => setActiveStep(activeStep => activeStep - 1)}>
              <Image alt='Carousel Arrow' src={CarouselArrow} />
            </Arrow>
            <Text>{`${activeStep} of ${steps.length}`}</Text>
            {activeStep === steps.length ? (
              <PillButton onClick={() => handleBack()} small text='Done' />
            ) : (
              <Arrow
                hide={activeStep === steps.length}
                id='lesson-forward-arrow'
                onClick={() => setActiveStep(activeStep => activeStep + 1)}
              >
                <Image alt='Carousel Arrow' src={CarouselArrow} />
              </Arrow>
            )}
          </Footer>
        </Wrapper>
      )}
    </Layout>
  )
}

Lesson.propTypes = {
  activeLesson: PropTypes.object,
  cta: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
}

export default Lesson
