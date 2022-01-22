import { useRef } from 'react'
import PropTypes from 'prop-types'
import styled, { keyframes } from 'styled-components'

import { CloseIcon, colorType, colors, devices, shadows, ToastInfoIcon } from '@assets'
import { Image, Text, Title } from '@components'
import { useToastContext } from '@contexts'
import { gradientGenerator, handleClickOut } from '@utils'

// backslashes needed due to an active styled-components bug when using percentages in keyframes...JK
const spin = keyframes`
  \ 0% { transform: rotateY(0); }
  \ 100% { transform: rotateY(1080deg); }
`

const CloseIconWrapper = styled.div`
  background-color: ${colors.white}CC;
  border-radius: 50%;
  box-shadow: ${shadows.card};
  cursor: pointer;
  display: none;
  height: 30px;
  padding: 5px;
  position: absolute;
  right: -10px;
  top: -10px;
  transition: all 150ms ease;
  width: 30px;
  z-index: 1;

  @media (${devices.desktop}) {
    display: initial;

    &:hover {
      background-color: ${colors.gray8};
      transform: scale(1.1);
    }
  }
`

const Container = styled.div`
  align-items: center;
  display: flex;
  padding: 5px 8px 5px 5px;
  position: relative;

  @media (${devices.desktop}) {
    padding: 20px;
  }
`

const Content = styled.div`
  flex: 1;
`

const Details = styled(Text)`
  display: none;

  @media (${devices.desktop}) {
    display: initial;
  }
`

const Icon = styled.div`
  align-items: center;
  background-color: ${p => colors[p.bgColor] ?? colors.blurple};
  backface-visibility: hidden;
  border-radius: 50%;
  display: flex;
  height: 35px;
  margin-right: 5px;
  padding: 7px;
  width: 35px;
  transform: translateZ(1px);

  ${p => p.gradient && `${gradientGenerator(p.gradient)}`}

  img {
    animation: ${p => p.spin && spin} 2500ms cubic-bezier(0.23, 0, 0, 0.99) forwards;
    width: 100%;
  }

  @media (${devices.desktop}) {
    height: 43px;
    margin-right: 17px;
    padding: 10px;
    width: 43px;
  }
`

const Wrapper = styled.div`
  backdrop-filter: blur(11px);
  background-color: ${colors.white}80;
  border-radius: 30px;
  bottom: 130px;
  box-shadow: 0px 10px 24px rgba(89, 114, 215, 0.29);
  left: 50%;
  max-width: 345px;
  opacity: ${p => (p.open ? 1 : 0)};
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: fixed;
  transform: translate(-50%, ${p => (p.open ? 0 : '75px')});
  transition: all 150ms cubic-bezier(0.55, 0.01, 0.4, 1);
  z-index: 16;

  @media (${devices.desktop}) {
    border-radius: 20px;
    bottom: 25px;
    left: 25px;
    transform: translateY(${p => (p.open ? 0 : '75px')});
  }
`

const Toast = ({ bgColor, callout, details, gradient, icon, id, open, spin = false }) => {
  const ref = useRef(null)
  const { handleShowToast } = useToastContext()

  handleClickOut(ref, () => {
    if (open) handleShowToast(false)
  })

  return (
    <Wrapper id={id} open={open} ref={ref}>
      <Container>
        <Icon bgColor={bgColor} gradient={gradient} spin={spin}>
          <Image alt='Toast icon' src={icon || ToastInfoIcon} />
        </Icon>
        <Content>
          {callout && (
            <Title fontSize={['14px', '16px']} justifyContent='flex-start'>
              {callout}
            </Title>
          )}
          {details && <Details fontSize={['14px', '16px']}>{details}</Details>}
        </Content>
        <CloseIconWrapper onClick={() => handleShowToast(false)}>
          <CloseIcon color={colors.blurple} />
        </CloseIconWrapper>
      </Container>
    </Wrapper>
  )
}

Toast.propTypes = {
  bgColor: PropTypes.oneOf(colorType),
  callout: PropTypes.string,
  details: PropTypes.string,
  gradient: PropTypes.object,
  icon: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  open: PropTypes.bool,
  spin: PropTypes.bool,
}

export default Toast
