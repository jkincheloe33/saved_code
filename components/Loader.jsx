import PropTypes from 'prop-types'
import styled, { css, keyframes } from 'styled-components'

import { colors } from '@assets'

const TIMING = 600
const WIDTH = 26

const active = css`
  background: ${colors.blue};
  transform: scale(1.3);
`

const normal = css`
  background: #c4c4c4;
  transform: scale(1);
`

const one = keyframes`
	0% { ${active} }
	25% { ${normal} }
	75% { ${normal} }
	100% { ${active} }
`

const two = keyframes`
	0% { ${normal} }
	25% { ${active} }
	50% { ${normal} }
	75% { ${active} }
	100% { ${normal} }
`

const three = keyframes`
	0% { ${normal} }
	25% { ${normal} }
	50% { ${active} }
	75% { ${normal} }
`

// prettier-ignore
const Grey = styled.div`
	animation: ${one} ${TIMING * 4}ms infinite;
	background: #c4c4c4;
	border-radius: 50%;
	height: ${WIDTH}px;
	transition: all ${TIMING}ms cubic-bezier(0.93, 0.02, 0.07, 0.98);
	width: ${WIDTH}px;

	&:nth-child(2) {
		animation-name: ${two};
	}

	&:nth-child(3) {
		animation-name: ${three};
	}
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: 60px auto;
  max-width: ${WIDTH * 5}px;
  position: relative;
  width: 100%;
`

const dots = [...Array(3)]

const Loader = ({ className }) => (
  <Wrapper className={className}>
    {dots.map((a, i) => (
      <Grey key={i} />
    ))}
  </Wrapper>
)

Loader.propTypes = {
  className: PropTypes.string,
}

export default Loader
