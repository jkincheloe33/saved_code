import { createRef, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { breakpoints, CarouselArrow, CheckmarkIcon3, ClockIcon, colors, devices, shadows } from '@assets'
import { Card as CardBase, DynamicContainer, Image, Layout, Loader, ProgressCircle, Text, Title as TitleBase } from '@components'
import { useResizeContext } from '@contexts'
import { gradientGenerator, uId } from '@utils'

const ARROW_RATIO = 40

const Arrow = styled.div`
  align-items: center;
  background: ${colors.white};
  border: 1px solid ${colors.gray3}20;
  border-radius: 50%;
  box-shadow: ${shadows.card};
  cursor: pointer;
  display: none;
  height: ${ARROW_RATIO}px;
  justify-content: center;
  left: ${p => (p.back ? '10px' : 'auto')};
  opacity: ${p => (p.hide ? 0 : 1)};
  pointer-events: ${p => (p.hide ? 'none' : 'auto')};
  position: absolute;
  right: ${p => (p.back ? 'auto' : '10px')};
  top: 50%;
  transform: translateY(-50%) ${p => (p.back ? 'rotate(180deg)' : '')};
  transform-origin: center center;
  transition: all 500ms ease;
  width: ${ARROW_RATIO}px;

  &:hover {
    transform: translateY(-50%) scale(1.2) ${p => (p.back ? 'rotate(180deg)' : '')};
  }

  @media (${devices.desktop}) {
    display: flex;
  }
`

const Card = styled(CardBase)`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`

const Checkmark = styled(CheckmarkIcon3)`
  left: calc(50% + 0.5px);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`

const Content = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 45px 50px 50px;

  @media (${devices.desktop}) {
    padding: 45px 37px;
  }
`

const Header = styled(TitleBase)`
  padding: 35px 20px 18px;
  text-align: center;
`

const IconWrapper = styled.div`
  border-radius: 50%;
  height: ${p => p.svgRatio}px;
  position: relative;
  width: ${p => p.svgRatio}px;

  ${p => p.gradient && `${gradientGenerator(p.gradient)}`}
`

const Item = styled.div`
  cursor: pointer;
  flex: 0 0 100%;
  max-width: 400px;
  padding: 0 20px;
  transform: translateX(${p => (p.active - 1) * -100}%) translateZ(0) scale(${p => (p.active === p.index ? 1.15 : 1)});
  transition: transform 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;

  @media (${devices.desktop}) {
    flex-basis: 25%;
    transform: translateX(${p => (p.active - 1) * -100}%) translateZ(0);
    width: 25%;
  }
`

const Page = styled(Text)`
  background-color: ${colors.gray8};
  bottom: 0;
  padding: 10px 0;
  position: fixed;
  text-align: center;
  width: 100%;

  @media (${devices.desktop}) {
    display: none;
  }
`

const PrimaryImage = styled(Image)`
  margin: 0 auto;
  max-height: 175px;
  object-fit: contain;
  padding: 30px 0;
  width: 100%;
`

const ProgressText = styled(Text)`
  padding-left: 10px;
`

const TimeWrapper = styled.div`
  align-items: center;
  border-top: 1px solid ${colors.gray3}20;
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding: 24px 0;
  text-align: center;
  width: 100%;
`

const Title = styled(TitleBase)`
  text-align: center;
`

const Wrapper = styled.div`
  align-items: stretch;
  display: flex;
  flex-wrap: nowrap;
  margin-bottom: 40px;
  overflow: hidden;
  padding: 52px 37.5px;

  @media (${devices.desktop}) {
    margin: 0;
    padding: 12px 20px;
    position: relative;
  }
`

const Lessons = ({ active, cta, handleBack, lessons, loading, setActive, setActiveLesson }) => {
  const [activeItem, setActiveItem] = useState(1)
  const [animateProgress, setAnimateProgress] = useState(false)
  const { windowWidth } = useResizeContext()

  // stores the horizontal location that a user presses down...JK
  const { current } = useRef({ xDown: null })
  const containerRef = useRef(null)

  const checkmarkWidth = useMemo(() => (windowWidth < breakpoints.desktop ? 7 : 10), [windowWidth])
  const svgRatio = useMemo(() => (windowWidth < breakpoints.desktop ? 20 : 28), [windowWidth])

  // calculates number of carousel pages we should have on desktop...JK
  const carouselPages = useMemo(() => (lessons?.length > 0 ? Math.ceil(lessons.length / 4) : 0), [lessons])
  // creates array of refs to assign to each lesson once the lessons data is fetched...JK
  const refs = useMemo(() => lessons?.map(() => createRef()), [lessons])

  // triggers animation for the progress circles each time you hit this screen...JK
  useEffect(() => {
    if (active === 1 && !loading) setAnimateProgress(true)
    else setAnimateProgress(false)
  }, [active, loading])

  useEffect(() => {
    if (containerRef?.current) {
      // adds enough left padding to have the active item centered in the container on all screens smaller than desktop...JK
      if (refs.length && windowWidth < breakpoints.desktop) {
        const middle = containerRef.current.getBoundingClientRect().width / 2
        const childWidth = refs[1].current?.getBoundingClientRect().width
        const paddingLeft = middle - childWidth / 2
        containerRef.current.style.paddingLeft = `${paddingLeft}px`
        // desktop we just set the paddingLeft to 20px...JK
      } else containerRef.current.style.paddingLeft = '20px'
    }
  }, [refs, windowWidth])

  // sets xDown and yDown to the point where the user initially touches or clicks...JK
  const handleDown = e => {
    current.xDown = e.touches?.[0].clientX ?? e.screenX
    current.yDown = e.touches?.[0].clientY ?? e.screenY
  }

  // if the user moves their finger/mouse 50px left or right from the initial xDown point, we update the active state + or minus 1 depending on which way they swiped...JK
  const handleUp = (e, completedAt, id, image, step, title) => {
    const xEnd = e.changedTouches?.[0].clientX ?? e.screenX
    const yEnd = e.changedTouches?.[0].clientY ?? e.screenY
    const xDifference = xEnd - current.xDown
    const yDifference = yEnd - current.yDown

    if (windowWidth < breakpoints.desktop) {
      if (xDifference >= 50 && activeItem !== 1) return setActiveItem(activeItem => activeItem - 1)
      if (xDifference <= -50 && activeItem !== lessons.length) return setActiveItem(activeItem => activeItem + 1)
    }

    // this acts as the onClick event if the user doesn't swipe more than 50px left/right or scroll more than 50px up/down...JK
    if (xDifference < 50 && xDifference > -50 && yDifference < 50 && yDifference > -50) {
      setActiveLesson({ id, image, step: !completedAt ? step : 1, title })
      setActive(2)
    }
  }

  return (
    <Layout cta={cta} dark full handleBack={handleBack} id='wambi-lessons' inner noFooter title='Lessons'>
      <DynamicContainer>
        {!loading && lessons.length > 0 && (
          <Header fontSize='16px' fontWeight={400} noClamp>
            Learn the Wambi basics in 10 minutes or less with these quick lessons
          </Header>
        )}
        {!loading && !lessons.length && <Header justifyContent='center'>No lessons currently available</Header>}
        <Wrapper ref={containerRef}>
          {loading ? (
            <Loader />
          ) : (
            lessons.length > 0 &&
            lessons.map(({ completedAt, id, image, readMinutes, step, summary, title, totalSteps }, i) => (
              <Item
                active={activeItem}
                id={uId('lesson')}
                index={i + 1}
                key={i}
                onMouseDown={handleDown}
                onMouseUp={e => handleUp(e, completedAt, id, image, step, title)}
                onTouchEnd={e => handleUp(e, completedAt, id, image, step, title)}
                onTouchStart={handleDown}
                ref={refs[i]}
              >
                <Card>
                  <Content>
                    <Title fontSize='18px'>{title}</Title>
                    <PrimaryImage alt='Lesson Image' src={image} />
                    <Title fontSize='18px' fontWeight={400}>
                      {summary}
                    </Title>
                  </Content>
                  <TimeWrapper>
                    {step === 0 ? (
                      <>
                        <Image alt='Clock Icon' src={ClockIcon} width='15px' />
                        <ProgressText>{readMinutes} minutes</ProgressText>
                      </>
                    ) : !completedAt ? (
                      <>
                        <IconWrapper svgRatio={svgRatio}>
                          <ProgressCircle
                            animate={animateProgress}
                            currentProgress={step}
                            id={`progress-lesson-${id}`}
                            ratio={svgRatio}
                            strokeWidth={3}
                            totalProgress={totalSteps}
                          />
                          <Checkmark width={checkmarkWidth} />
                        </IconWrapper>
                        <ProgressText color='gray1'>In Progress</ProgressText>
                      </>
                    ) : (
                      <>
                        <IconWrapper
                          gradient={{
                            colors: [
                              {
                                color: 'mint',
                                location: '30%',
                              },
                              {
                                color: 'skyBlue',
                                location: '100%',
                              },
                            ],
                            position: 'to bottom',
                          }}
                          svgRatio={svgRatio}
                        >
                          <Checkmark color='white' width={checkmarkWidth} />
                        </IconWrapper>
                        <ProgressText color='gray1'>Complete</ProgressText>
                      </>
                    )}
                  </TimeWrapper>
                </Card>
              </Item>
            ))
          )}
          <Arrow back hide={activeItem === 1} id='lessons-back-arrow' onClick={() => setActiveItem(activeItem => activeItem - 4)}>
            <Image alt='Carousel Arrow' src={CarouselArrow} />
          </Arrow>
          <Arrow
            hide={carouselPages <= Math.ceil(activeItem / carouselPages)}
            id='lessons-forward-arrow'
            onClick={() => setActiveItem(activeItem => activeItem + 4)}
          >
            <Image alt='Carousel Arrow' src={CarouselArrow} />
          </Arrow>
        </Wrapper>
      </DynamicContainer>
      <Page>{`${activeItem} of ${lessons.length}`}</Page>
    </Layout>
  )
}

Lessons.propTypes = {
  active: PropTypes.number,
  cta: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
  lessons: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  setActive: PropTypes.func.isRequired,
  setActiveLesson: PropTypes.func.isRequired,
}

export default Lessons
