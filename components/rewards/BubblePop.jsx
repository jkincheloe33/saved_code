import { createRef, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, BubbleIcon, GiftIcon } from '@assets'
import { Bubble, DynamicContainer, Image, PillButton, PopUp, Text, Title } from '@components'
import { useResizeContext, useRewardContext } from '@contexts'
import { api } from '@services'

const MAX_POPS = 6
const MIN_POPS = 2

const Blur = styled.div`
  /* backdrop-filter: blur(20px);
  background-color: ${colors.white}33; */
  background-color: ${colors.white}E6;
  height: 100%;
  opacity: ${p => (p.open ? 1 : 0)};
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: fixed;
  transition: opacity 500ms ease;
  width: 100%;
`

const Cancel = styled(Text)`
  cursor: pointer;
`

const Circle = styled.div`
  align-items: center;
  /* backdrop-filter: blur(11px);
  background-color: ${colors.white}33; */
  background-color: ${colors.white};
  border-radius: 50%;
  /* box-shadow: 0px 64px 64px rgba(89, 114, 215, 0.15); */
  box-shadow: 0 0 100px rgba(89, 114, 215, 0.2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 225px;
  justify-content: center;
  width: 225px;
`

const Continue = styled.div`
  display: flex;
  justify-content: center;
  padding: 30px;
`

const Directions = styled.div`
  background-color: ${colors.white}80;
  border-radius: 20px;
  margin-top: 60px;
  max-width: 335px;
  padding: 40px 0;
  text-align: center;
  width: 100%;
`

const Gift = styled(Circle)`
  left: 50%;
  opacity: ${p => (p.complete ? 1 : 0)};
  pointer-events: ${p => (p.complete ? 'auto' : 'none')};
  position: absolute;
  top: 50%;
  transform: ${p => (p.complete ? 'translate(-50%, -95%)' : 'translate(-50%, -30%)')};
  transition: all 500ms ease;

  img {
    width: 70px;
  }
`

const Info = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`

const Particle = styled.div`
  background-image: url(${BubbleIcon});
  background-position: center center;
  background-size: cover;
  border-radius: 50%;
  height: ${p => p.ratio}px;
  left: 0;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  transition: all 0 ease;
  width: ${p => p.ratio}px;
`

const Start = styled(Blur)`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 170px 0 60px;
`

const WinningText = styled(Text)`
  margin-top: 20px;
  padding: 0 65px;
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  background-color: ${colors.gray8};
  overflow: hidden;
  position: relative;
`

const DIRECTION = {
  X: {
    0: 'right',
    1: 'left',
  },
  Y: {
    0: 'down',
    1: 'up',
  },
}

const OPTIONS = {
  RD: JSON.stringify({ x: 'right', y: 'down' }),
  RU: JSON.stringify({ x: 'right', y: 'up' }),
  LD: JSON.stringify({ x: 'left', y: 'down' }),
  LU: JSON.stringify({ x: 'left', y: 'up' }),
}

const BubblePop = ({ bubbleAmount = 20, handleClose, rewardScreens, setActive, setGameComplete, setReward }) => {
  const [activeIndex, setActiveIndex] = useState(null)
  const [complete, setComplete] = useState(false)
  const [hiddenBubbles, setHiddenBubbles] = useState([])
  const [pops, setPops] = useState(0)
  const [start, setStart] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { windowHeight, windowWidth } = useResizeContext()
  const { getRewardProgress, rewardProgressId } = useRewardContext()

  // array the length of bubbleAmount to use for looping over...JK
  const bubbles = [...Array(bubbleAmount)]
  // generates random bubble size between 60 and 170...JK
  const bubbleRatios = useRef(bubbles.map(() => Math.floor(Math.random() * (170 - 60 + 1) + 60)))
  // parent container...JK
  const containerRef = useRef(null)
  // array with arbitrary length to represent the amount of particles you want. used for looping over...JK
  const particles = [...Array(13)]
  // generates random particle size between 5 and 20...JK
  const particleRatios = useRef(particles.map(() => Math.floor(Math.random() * (20 - 5 + 1) + 5)))
  // creates an array of refs to associate to each particle...JK
  const particleRefs = useRef(particles.map(() => createRef()))
  // generates a random number between (MAX_POPS or bubbleAmount - whichever is less) and MIN_POPS...EG & JK
  const popsRequired = useRef(Math.floor(Math.random() * ((MAX_POPS <= bubbleAmount ? MAX_POPS : bubbleAmount) - MIN_POPS + 1)) + MIN_POPS)
  // assigns a random number between 0.25 and 1 that represents the speed a bubble will move around the page...JK
  const speed = useRef(bubbles.map(() => Math.random() * 1 + 0.25))
  // creates an array of refs to associate a ref to each bubble...JK
  const refs = useRef(bubbles.map(() => createRef()))

  // assigns a random direction for x and y based off the ${DIRECTION} enum by generating a 1 or 0
  let directions = bubbles.map(() => {
    const directionX = DIRECTION.X[Math.floor(Math.random() * 2)]
    const directionY = DIRECTION.Y[Math.floor(Math.random() * 2)]
    return { x: directionX, y: directionY }
  })

  const d2r = x => x * (Math.PI / 180)

  const handleClick = (ref, i) => {
    if (ref?.current) pop(13, ref)
    setActiveIndex(i)
    setHiddenBubbles(hiddenBubbles => [...hiddenBubbles, i])
    setPops(pops => pops + 1)
  }

  // handles all the calculation for where a bubble should move to and what direction it should be moving in...JK
  const handleRaf = () => {
    // prevents handleRaf from running on unmount...JK
    if (refs?.current?.[refs.current.length - 1]?.current) {
      refs.current.forEach((ref, i) => {
        const el = ref.current
        const { width, x, y } = el.getBoundingClientRect()
        // distance from the left & top of the parent container...JK
        const locationX = x - containerRef.current.getBoundingClientRect().x
        const locationY = y - containerRef.current.getBoundingClientRect().y

        // update the direction if the bubble hits any of the 4 sides of the screen...JK
        if (locationX >= windowWidth) directions[i].x = 'left'
        if (locationX + width <= 0) directions[i].x = 'right'
        if (locationY >= windowHeight) directions[i].y = 'up'
        if (locationY + width <= 0) directions[i].y = 'down'

        // move the bubble left/right & up/down depending on what their directions are set to...JK
        if (JSON.stringify(directions[i]) === OPTIONS.RD) {
          el.style.transform = `translate(${locationX + speed.current[i]}px, ${locationY + speed.current[i]}px) translateZ(0)`
        } else if (JSON.stringify(directions[i]) === OPTIONS.RU) {
          el.style.transform = `translate(${locationX + speed.current[i]}px, ${locationY - speed.current[i]}px) translateZ(0)`
        } else if (JSON.stringify(directions[i]) === OPTIONS.LD) {
          el.style.transform = `translate(${locationX - speed.current[i]}px, ${locationY + speed.current[i]}px) translateZ(0)`
        } else if (JSON.stringify(directions[i]) === OPTIONS.LU) {
          el.style.transform = `translate(${locationX - speed.current[i]}px, ${locationY - speed.current[i]}px) translateZ(0)`
        }
      })
    }

    requestAnimationFrame(handleRaf)
  }

  // sets new position of particles relative to the current bubble popped and animates them out in different directions...JK
  const pop = (particleCount, ref) => {
    const { width, x: locationX, y: locationY } = ref?.current.getBoundingClientRect()
    const offsetX = width / 2
    const offsetY = width / 2

    let angle = 0

    for (let i = 0; i < particleCount; i++) {
      const pRef = particleRefs.current[i].current
      const rad = d2r(angle)
      const x = Math.cos(rad) * (80 + Math.random() * 20)
      const y = Math.sin(rad) * (80 + Math.random() * 20)

      // had to animate via javascript due to re-render issues when using state...JK
      // relocate particle relative to current bubble...JK
      pRef.style.opacity = 1
      pRef.style.transitionDuration = '0ms'
      pRef.style.transform = `translate(${locationX + offsetX}px, ${locationY + offsetY}px) translateZ(0) scale(1)`

      // setTimeout needed to give pRef time to update location before updating to end location...JK
      setTimeout(() => {
        pRef.style.opacity = 0
        pRef.style.transitionDuration = '1000ms'
        pRef.style.transform = `translate(${locationX + x}px, ${locationY + y}px) translateZ(0) scale(0)`
      }, 1)

      // changes the angle to send the next particle in a different direction
      angle += 360 / particleCount
    }
  }

  // renders each ref in a random location on the page...JK
  useEffect(() => {
    // checks that the last ref has been mounted before running...JK
    if (refs?.current?.[refs.current.length - 1]?.current) {
      refs.current.forEach(ref => {
        // create random x & y values between 1 and the current window height/width...JK
        const randomX = Math.floor(Math.random() * windowWidth) + 1
        const randomY = Math.floor(Math.random() * windowHeight) + 1

        // assign randomX & randomY values to a translate for initial render...JK
        ref.current.style.transform = `translate(${randomX}px, ${randomY}px) translateZ(0)`
      })

      // run animation once all bubbles are created and their initial positions have been calculated...JK
      handleRaf()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowHeight, windowWidth])

  // handles tracking the number of bubbles popped and completes the game once they've popped the required amount...JK
  useEffect(() => {
    if (pops === popsRequired.current) {
      // submit logic will go here...JK
      setComplete(true)
    }
  }, [activeIndex, pops])

  const completeGame = async () => {
    // Add hook to ensure that gameComplete endpoint runs once...CY
    setSubmitting(true)
    const {
      data: { msg, reward, success },
    } = await api.post('/reward/gameComplete', { rewardProgressId })
    if (success) {
      setGameComplete(true)
      setReward(reward)
      setActive(rewardScreens.CLAIM_REWARD)
      await getRewardProgress()
    } else {
      alert(msg)
      handleClose()
    }
  }

  return (
    <Wrapper ref={containerRef}>
      {bubbles.map((_, i) => (
        <Bubble
          complete={complete}
          handleClick={() => handleClick(refs.current[i], i)}
          id={`bubble-${i}`}
          key={i}
          ref={refs.current[i]}
          ratio={bubbleRatios.current[i]}
          remove={hiddenBubbles.includes(i)}
        />
      ))}
      {particles.length > 0 &&
        particles.map((_, i) => <Particle key={i} ratio={particleRatios.current[i]} ref={particleRefs.current[i]} />)}
      <Blur open={complete}>
        <Gift complete={complete}>
          <Image alt='Present Icon' src={GiftIcon} />
          <WinningText fontSize='15px' noClamp>
            You unlocked a gift!
          </WinningText>
        </Gift>
      </Blur>
      <Start open={!start}>
        <Info>
          <Circle onClick={() => setStart(true)}>
            <Title color='blurple' fontSize='28px'>
              Let&apos;s Go
            </Title>
          </Circle>
          <Directions>
            <Text>Pop bubbles to unlock surprises!</Text>
          </Directions>
        </Info>
        <Cancel color='blurple' fontWeight={600} onClick={handleClose}>
          Not now
        </Cancel>
      </Start>
      <PopUp open={complete}>
        <Continue>
          <PillButton disabled={submitting} full onClick={completeGame} text='Continue' />
        </Continue>
      </PopUp>
    </Wrapper>
  )
}

BubblePop.propTypes = {
  bubbleAmount: PropTypes.number, // 3 bubble minimum...JK
  handleClose: PropTypes.func,
  rewardScreens: PropTypes.object,
  setActive: PropTypes.func,
  setGameComplete: PropTypes.func,
  setReward: PropTypes.func,
}

export default BubblePop
