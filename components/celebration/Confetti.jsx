import { forwardRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import confetti from 'canvas-confetti'

const Canvas = styled.canvas`
  height: 100%;
  pointer-events: none;
  position: fixed;
  width: 100%;
`

const Confetti = forwardRef(({ setConfetti }, ref) => {
  useEffect(() => {
    if (ref?.current) {
      setConfetti(() =>
        confetti.create(ref.current, {
          resize: true,
          useWorker: true,
        })
      )
    }
  }, [ref, setConfetti])
  return <Canvas ref={ref} />
})

Confetti.displayName = 'Confetti'

Confetti.propTypes = {
  setConfetti: PropTypes.func.isRequired,
}

export default Confetti
