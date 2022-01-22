import { createRef, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styled, { keyframes } from 'styled-components'

import { colors, gradients } from '@assets'
import { PillButton } from '@components'
import { useResizeContext, useRewardContext } from '@contexts'
import { api } from '@services'

// backslashes needed due to an active styled-components bug when using percentages in keyframes...JK
const blink = keyframes`
  \ 0% { opacity: 1; }
  \ 50% { opacity: 0; }
  \ 100% { opacity: 1; }
`

const Bubble = styled.div`
  animation: ${blink} 3000ms ease infinite;
  animation-delay: ${p => p.animationDelay}ms;
  background-color: ${colors.white}80;
  left: 0;
  border-radius: 50%;
  height: ${p => (p.large ? 8 : 4)}px;
  position: absolute;
  top: 0;
  width: ${p => (p.large ? 8 : 4)}px;
`

const Button = styled(PillButton)`
  margin-top: 35px;
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

const PlayButton = ({ clickEvent, plays }) => {
  const containerRef = useRef(null)
  const { windowHeight, windowWidth } = useResizeContext()
  const { rewardScreens, setOpenRewardWorkflow, setRewardProgressId, setSelectedActive } = useRewardContext()

  const bubbles = [...Array(9)]
  const playsText = plays > 1 ? ` (${plays})` : ''
  // creates an array of refs to associate a ref to each bubble...JK
  const refs = useRef(bubbles.map(() => createRef()))
  // assigns a random number between 0.75 and 1.5 that represents the speed a bubble will move around the page...JK
  const speed = useRef(bubbles.map(() => Math.random() * 0.1 + 0.25))

  // assigns a random direction for x and y based off the ${DIRECTION} enum by generating a 1 or 0
  let directions = bubbles.map(() => {
    const directionX = DIRECTION.X[Math.floor(Math.random() * 2)]
    const directionY = DIRECTION.Y[Math.floor(Math.random() * 2)]
    return { x: directionX, y: directionY }
  })

  // handles all the calculation for where a bubble should move to and what direction it should be moving in...JK
  const handleRaf = () => {
    // prevents handleRaf from running on unmount...JK
    if (refs?.current?.[refs.current.length - 1]?.current) {
      // container values...JK
      const { height: containerH, width: containerW, x: containerX, y: containerY } = containerRef.current.getBoundingClientRect()

      refs.current.forEach((ref, i) => {
        const el = ref.current
        const { width, x, y } = el.getBoundingClientRect()
        // distance from the left & top of the parent container...JK
        const locationX = x - containerX
        const locationY = y - containerY

        // update the direction if the bubble hits any of the 4 sides of the parent container...JK
        if (locationX >= containerW) directions[i].x = 'left'
        if (locationX + width <= 0) directions[i].x = 'right'
        if (locationY >= containerH) directions[i].y = 'up'
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

  const playEvent = async () => {
    if (clickEvent) clickEvent()
    const {
      data: { success, rewardProgressId },
    } = await api.get('/reward/getRewardProgressId')
    if (success && rewardProgressId) {
      setRewardProgressId(rewardProgressId)
      setSelectedActive(rewardScreens.BUBBLE_POP)
      setOpenRewardWorkflow(true)
    }
  }

  // renders each ref in a random location on the page...JK
  useEffect(() => {
    // checks that the last ref has been mounted before running...JK
    if (containerRef?.current && refs?.current?.[refs.current.length - 1]?.current) {
      const { height, width } = containerRef.current.getBoundingClientRect()

      refs.current.forEach(ref => {
        // create random x & y values between 1 and the container parameters...JK
        const randomX = Math.floor(Math.random() * width) + 1
        const randomY = Math.floor(Math.random() * height) + 1

        // assign randomX & randomY values to a translate for initial render...JK
        ref.current.style.transform = `translate(${randomX}px, ${randomY}px) translateZ(0)`
      })

      // run animation once all bubbles are created and their initial positions have been calculated...JK
      handleRaf()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowHeight, windowWidth])

  return (
    <Button
      background={gradients.blurple}
      full
      id='play-game-btn'
      onClick={playEvent}
      ref={containerRef}
      text={`Surprise! ${playsText}`}
      thin
    >
      {bubbles.map((_, i) => (
        <Bubble animationDelay={1000 * i} key={i} large ref={refs.current[i]} />
      ))}
    </Button>
  )
}

PlayButton.propTypes = {
  clickEvent: PropTypes.func,
  plays: PropTypes.number,
}

export default PlayButton
