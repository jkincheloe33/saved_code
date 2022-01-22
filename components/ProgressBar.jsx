import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Text } from '@components'

const Base = styled.div`
  background-color: ${p => colors[p.color]};
  border-radius: 4px;
  height: 7px;
`

const Progress = styled.div`
  background-color: ${p => (p.progress >= p.max ? colors[p.colors.complete] : colors[p.colors.progress])};
  border-radius: 4px;
  height: 7px;
  transition: all 250ms ease;
  width: ${p => (p.progress > p.max ? '100%' : `${(p.progress / p.max) * 100}%`)};
`

const ProgressLabel = styled(Text)`
  color: ${p => colors[p.color]};
  margin-bottom: 10px;
  text-align: center;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const defaultColors = {
  background: 'gray8',
  complete: 'mint',
  progress: 'yellow',
}

const ProgressBar = ({ className, colors = defaultColors, label, max, progress }) => {
  return (
    <Wrapper className={className}>
      {label && (
        <ProgressLabel color={colors.progress} fontWeight={700}>
          {label}
        </ProgressLabel>
      )}
      <Base color={colors.background}>
        <Progress colors={colors} max={max} progress={progress} />
      </Base>
    </Wrapper>
  )
}

ProgressBar.propTypes = {
  className: PropTypes.string,
  colors: PropTypes.shape({
    background: PropTypes.string,
    complete: PropTypes.string,
    progress: PropTypes.string,
  }),
  label: PropTypes.string,
  max: PropTypes.number,
  progress: PropTypes.number,
}

export default ProgressBar
