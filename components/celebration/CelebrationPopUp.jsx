import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import {
  breakpoints,
  CloseIcon,
  colors,
  devices,
  gradients,
  HotStreakIcon,
  LessonIcon,
  multiplier,
  PerfectScoreIcon,
  shadows,
  StarIcon,
} from '@assets'
import { CelebrationIcon, Confetti, PlayButton, RewardProgressBar, Text, Title } from '@components'
import { useCelebrationContext, useResizeContext } from '@contexts'
import { CELEBRATION_TYPES, handleClickOut } from '@utils'

const CLOSE_TIMING = 6000
const CONFETTI_TIMING = 3000
const OPEN_TIMING = 250
const TIMING = 500

// prettier-ignore
const Bar = styled.div`
  background-color: ${colors.white};
  border-radius: 12px;
  height: 2px;
  left: 0;
  position: relative;
  top: 0;
  transform-origin: top left;
  transition: transform 250ms ease;
  width: 100%;

  &:nth-of-type(2) {
    top: 60%;
  }

  &:last-of-type {
    bottom: 0;
    top: auto;
  }
`

const BarContainer = styled.div`
  display: inline-block;
  height: 10px;
  margin: 0 5px;
  width: 15px;
`

const checkmark = keyframes`
  0% { height: 0; width: 0 }
  30% { height: 1px; width: 8px; }
  50% { height: 9px: width: 8px; }
  70% { height: 18px; opacity: 1; }
  100% { opacity: 1 }
`

const Checkmark = styled.div`
  display: ${p => (p.open ? 'inline-block' : 'none')};
  height: 60px;
  position: relative;
  vertical-align: top;
  width: 60px;

  &::after {
    animation: ${checkmark} ${TIMING}ms ease forwards;
    animation-delay: ${TIMING}ms;
    border-radius: 1px 2px 1px 1px;
    border-right: 3px solid white;
    border-top: 3px solid white;
    content: '';
    height: 18px;
    left: 20px;
    opacity: 0;
    position: absolute;
    top: 33px;
    transform: scaleX(-1) rotate(145deg);
    transform-origin: left top;
    width: 8px;
  }
`

const CloseIconWrapper = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  height: 40px;
  position: absolute;
  right: 22px;
  top: 10px;
  width: 20px;
`

const Content = styled.div`
  align-items: center;
  /* backdrop-filter: blur(23px);
  background: rgba(255, 255, 255, 0.44); */
  background: ${colors.white};
  border-radius: 30px 30px 0 0;
  box-shadow: ${shadows.card};
  display: flex;
  flex-direction: column;
  height: ${p => (p.type === CELEBRATION_TYPES.CHALLENGE_COMPLETE ? '320' : '213')}px;
  justify-content: center;
  overflow: auto;
  transform: ${p => (p.open ? 'translateY(0%)' : 'translateY(110%)')};
  transition: transform ${OPEN_TIMING}ms cubic-bezier(0.93, 0.02, 0.07, 0.98);
  text-align: center;
  width: 100%;
  &::before {
    background-color: ${colors.gray7};
    border-radius: 40px;
    content: '';
    height: 5px;
    left: 50%;
    position: absolute;
    top: ${multiplier}px;
    transform: translateX(-50%);
    width: 65px;
  }
`

const CheckmarkWrapper = styled.div`
  background: ${p => p.color ?? gradients.greenBlue};
  border-radius: 50%;
  height: 60px;
  margin-bottom: ${multiplier * 2}px;
  position: relative;
  width: 60px;
  display: flex;
`

const PeckLessonIcon = styled(LessonIcon)`
  display: inline-block;
  height: 10px;
  margin: 0 5px;
  width: 20px;
`

const PeckPopup = styled.div`
  background: ${gradients.blurple};
  border-radius: 30px;
  height: 300px;
  left: 50%;
  padding: 0 70px;
  position: absolute;
  text-align: center;
  top: 40%;
  transform: translate(-50%, -50%);
  width: 350px;
  z-index: 21;

  @media (${devices.desktop}) {
    width: 370px;
  }
`

const PeckTitle = styled(Title)`
  margin: 40px 0 20px;
`

const Play = styled(PlayButton)`
  margin-top: 35px;
`

const PopupTitle = styled(Title)`
  margin-bottom: ${multiplier * 2}px;
`

const RewardProgressWrapper = styled.div`
  width: 324px;
`

const SurpriseText = styled(Text)`
  display: block;
  margin-bottom: 20px;
`

const Wrapper = styled.div`
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: flex-end;
  left: 0;
  overflow: hidden;
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  // Needs highest z-index to go over confetti/footers, to display anywhere in the app user gets a celebration...JC
  z-index: 20;
`

const challengeCompleteTitles = [
  'Congrats!',
  'Way to go!',
  'Well done!',
  'Woohoo!',
  'Sensational!',
  'Triumph!',
  'Joyful Day!',
  'Victory!',
  'Delightful!',
  'Jolly Good!',
  'Bravo!',
  'Hooray!',
  'Hip, Hip!',
  'Wowza!',
  'You Rock!',
]

const CelebrationPopUp = () => {
  const [challengeCompleteTitle, setChallengeCompleteTitle] = useState('')
  const [barCompleted, setBarCompleted] = useState(false)
  const [confetti, setConfetti] = useState(null)
  const [open, setOpen] = useState(false)
  const [openPecksPopup, setOpenPecksPopup] = useState(false)
  const [rewardCounter, setRewardCounter] = useState(0)
  const [timeoutArr, setTimeoutArr] = useState([])

  const { celebration, resetCelebration } = useCelebrationContext()
  const { completeChallenges, rewardProgress, type } = { ...celebration }
  const { windowWidth } = useResizeContext()

  const renderTypeList = {
    [CELEBRATION_TYPES.PERFECT_SCORE]: {
      src: PerfectScoreIcon,
      text: 'Congrats on a perfect score!',
      titleText: 'Way to Wambi!',
    },
    [CELEBRATION_TYPES.HOT_STREAK]: {
      src: HotStreakIcon,
      // eslint-disable-next-line
      text: 'You\'re on fire! Keep up the great work!',
      titleText: 'Hot Streak',
    },
  }

  const confettiNum = useMemo(() => (windowWidth < breakpoints.desktop ? 75 : 125), [windowWidth])

  const celebrationRef = useRef(null)
  const confettiRef = useRef(null)
  const pecksRef = useRef(null)
  const { current: skew } = useRef(Math.max(0.8, 1 - 0.001))
  const { current: timeLeft } = useRef(Date.now() + CONFETTI_TIMING - Date.now())
  const { current: ticks } = useRef(Math.max(200, 500 * (timeLeft / CONFETTI_TIMING)))

  useEffect(() => {
    setOpen(completeChallenges?.length > 0 || rewardProgress?.convertedPecks || Object.keys(renderTypeList).find(t => t == type))
    // eslint-disable-next-line
  }, [completeChallenges, rewardProgress, open, type])

  // Once open, load confetti / set overflow for popup...JC
  useEffect(() => {
    if (confetti && open) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      setChallengeCompleteTitle(challengeCompleteTitles[Math.floor(Math.random() * challengeCompleteTitles.length)])
      loadConfetti()

      // Dont automatically hide pop up if user signed in with converted pecks...JC
      if (!rewardProgress?.convertedPecks) {
        setTimeoutArr(t => [
          ...t,
          setTimeout(() => {
            confetti.reset()
            resetState()
          }, Math.ceil(rewardProgress?.overallProgress ?? 0 / 10) + CLOSE_TIMING),
        ])
      }
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confetti, open])

  handleClickOut([celebrationRef, confettiRef, pecksRef], () => {
    // Delay by animation open timing to ensure user doesn't close pop up while clicking before its open...JC
    if (open) setTimeoutArr(t => [...t, setTimeout(() => resetState(confettiRef), OPEN_TIMING)])
  })

  const loadConfetti = () => {
    const confettiColors = [colors.blurple, colors.mint, colors.digitalBlue, colors.fuschia]
    for (let i = 0; i < confettiNum; i++) {
      confettiColors.forEach(color =>
        confetti({
          colors: [color],
          disableForReducedMotion: true,
          gravity: 1.2,
          origin: {
            x: Math.random(),
            y: Math.random() * skew - 0.6,
          },
          particleCount: 1,
          scalar: Math.random() * (1 - 0.4) + 0.4,
          startVelocity: 0,
          ticks,
          zIndex: 19,
        })
      )
    }
  }

  const renderCelebration = () => {
    // Preserve challenge/rewards render as fallback for now, dont want to refactor too much at once...JC
    if (type === CELEBRATION_TYPES.CHALLENGE_COMPLETE) return renderChallengeType()
    return renderType(renderTypeList[type])
  }

  const renderChallengeType = () => (
    <>
      {!barCompleted && completeChallenges?.length ? (
        <>
          <CheckmarkWrapper>
            <Checkmark open={open} />
          </CheckmarkWrapper>
          <PopupTitle fontSize='22px' fontWeight='600'>
            {challengeCompleteTitle}
          </PopupTitle>
          <Text color='gray1'>
            {open &&
              `${completeChallenges[0].title} ${
                completeChallenges.length > 1
                  ? `+ ${completeChallenges.length - 1} ${completeChallenges.length === 2 ? 'other' : 'others'} `
                  : ''
              }`}
          </Text>
        </>
      ) : (
        <>
          <CelebrationIcon alt='Reward star' iconWidth='56px' margin='15' showBackground src={StarIcon} />
          <PopupTitle fontSize='22px' fontWeight='600'>
            {challengeCompleteTitle}
          </PopupTitle>
          {barCompleted && <Text color='gray1'>You’ve unlocked a surprise!</Text>}
        </>
      )}
      {rewardProgress ? (
        <RewardProgressWrapper>
          <RewardProgressBar
            animate
            canAddPlays
            overallProgress={rewardProgress.overallProgress}
            setBarCompleted={setBarCompleted}
            setOpenPecksPopup={setOpenPecksPopup}
            setRewardCounter={setRewardCounter}
            spacing={20}
            startProgress={rewardProgress.startProgress}
          />
          {barCompleted && <Play clickEvent={resetState} plays={rewardCounter} />}
        </RewardProgressWrapper>
      ) : null}
    </>
  )

  const renderType = ({ src, text, titleText }) => (
    <>
      <CelebrationIcon alt='Perfect score' iconWidth='56px' margin='15' src={src} />
      <PopupTitle fontSize='22px' fontWeight='600'>
        {titleText}
      </PopupTitle>
      <Text color='gray1'>{text}</Text>
    </>
  )

  const resetState = confettiRef => {
    // Get the canvas element and hide the confetti immediately on clickout...JC
    if (confettiRef?.current) confettiRef.current.style.display = 'none'
    // Clear all timeouts. Ensures popup timing is consistent (regardless of user clicking out early)...JC
    timeoutArr.forEach(t => clearTimeout(t))
    setTimeoutArr([])
    setBarCompleted(false)
    setChallengeCompleteTitle('')
    resetCelebration()
    setRewardCounter(0)
  }

  return (
    <Wrapper id='celebration-pop-up' open={open}>
      {open && <Confetti ref={confettiRef} setConfetti={setConfetti} />}
      {open && rewardProgress?.convertedPecks && openPecksPopup && (
        <PeckPopup ref={pecksRef}>
          <CloseIconWrapper onClick={() => setOpenPecksPopup(false)}>
            <CloseIcon color={colors.white}></CloseIcon>
          </CloseIconWrapper>
          <PeckTitle color='white' fontSize='22px'>
            Welcome to the new Wambi experience
          </PeckTitle>
          <SurpriseText color='white' noClamp>
            Good news! Your Pecks have unlocked surprises just for you!
          </SurpriseText>
          <Text color='white' noClamp>
            Learn more at <PeckLessonIcon color='white' /> Wambi Lessons in your
            <BarContainer>
              <Bar />
              <Bar />
              <Bar />
            </BarContainer>
            menu
          </Text>
        </PeckPopup>
      )}
      <Content open={open} ref={celebrationRef} type={type}>
        {renderCelebration()}
      </Content>
    </Wrapper>
  )
}

export default CelebrationPopUp
