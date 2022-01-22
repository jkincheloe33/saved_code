import { forwardRef, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CloseIcon, colors, devices, shadows } from '@assets'
import { handleClickOut } from '@utils'

const TIMING = 500

// prettier-ignore
const CloseIconWrapper = styled.div`
  cursor: pointer;
  height: 33px;
  position: absolute;
  right: ${p => (p.small ? '16px' : '25px')};
  top: ${p => (p.small ? '16px' : '25px')};
  width: 34px;
  z-index: 1;

  ${p => p.sidebar && `
    top: 26px;
  `}
`

// prettier-ignore
const Content = styled.div`
  background-color: ${p => colors[p.bgColor] ?? colors.white};
  border-radius: ${p => !p.small || p.sidebar ? 0 : '12px'};
  box-shadow: none;
  height: 100%;
  max-height: 100vh;
  // for IOS Mobile to account for navigation bars...JK
  max-height: -webkit-fill-available;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  transform: translate(0);
  transition: all ${TIMING}ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;

  ${p => p.small && `
    box-shadow: ${shadows.card};
    height: auto;
    width: auto;
  `}


  ${p => p.sidebar && `
    height: 100%;
  `}

  ${p => p.animationType === 'fadeIn' && `
    opacity: ${p.open ? 1 : 0};
  `}

  ${p => p.animationType === 'slideDown' && !p.open && p.small && `
    transform: translateY(-80vh);
  `}

  ${p => p.animationType === 'slideLeft' && !p.open && p.small && `
    transform: ${p.sidebar ? 'translateX(110%)' : 'translateX(75vw)'};
  `}

  ${p => p.animationType === 'slideRight' && !p.open && p.small && `
    transform: translateX(-75vw);
  `}

  ${p => p.animationType === 'slideUp' && !p.open && p.small && `
    transform: translateY(80vh);
  `}

  ${p => !p.open && p.killChild && `
    opacity: 0;
  `}

  @media (${devices.largeDesktop}) {
    ${p => !p.small && !p.full && `
      background-color: transparent;
      border-radius: 20px;
      box-shadow: ${shadows.card};
      height: 780px;
      max-height: 80vh;
      width: ${p.xl ? '1280px' : '763px'};
    `}

    ${p => p.shrink && 'width: auto;'}
  }
`

// prettier-ignore
const Wrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}BF;
  bottom: 0;
  box-shadow: ${shadows.modal};
  display: none;
  justify-content: ${p => p.sidebar ? 'flex-end' : 'center'};
  left: 0;
  opacity: ${p => p.open ? 1 : 0};
  overflow: auto;
  pointer-events: ${p => p.open ? 'auto' : 'none'};
  position: fixed;
  right: 0;
  top: 0;
  transition: all ${TIMING}ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  z-index: 5;

  ${p => !p.small && p.animationType !== 'fadeIn' && `
    opacity: 1;
  `}

  ${p => p.animationType === 'slideDown' && !p.small && `
    transform: translateY(-110%);
  `}

  ${p => p.animationType === 'slideLeft' && !p.small && `
    transform: translateX(110%);
  `}

  ${p => p.animationType === 'slideRight' && !p.small && `
    transform: translateX(-110%);
  `}

  ${p => p.animationType === 'slideUp' && !p.small && `
    transform: translateY(110%);
  `}

  ${p => p.open && `
    transform: translate(0);
  `}

  @media (${devices.largeDesktop}) {
    ${p => !p.small && `
      background-color: ${colors.white}D9;
      opacity: ${p.open ? 1 : 0};
      padding: ${p.xl ? '50px' : 0};
      transform: translateY(0);
      transition-timing-function: ease;
    `}
  }
`

const Modal = forwardRef(
  (
    {
      animationType = 'slideLeft',
      bgColor = 'white',
      children,
      className,
      full = false,
      handleClose,
      id,
      isNested = false,
      onClickOut,
      open = false,
      shrink = false,
      sidebar = false,
      small,
      xl = false,
    },
    ref
  ) => {
    const [childComponent, setChildComponent] = useState(null)
    const [killChild, setKillChild] = useState(false)
    const [show, setShow] = useState(false)

    const wrapperRef = useRef(null)
    // Avoid conditional useRef, but switch to passed in ref if provided...JC
    let modalRef = useRef()
    if (ref) modalRef = ref

    handleClickOut(modalRef, () => {
      if (onClickOut && open) return onClickOut()
      if (handleClose && open) handleClose()
    })

    useEffect(() => {
      // main scroll container in Layout component...JK
      const container = document.getElementById('scroll-container')

      if (open && wrapperRef?.current) {
        // need to manually set so that the component will animate open. if we used state here, the open animation wouldn't work...JK
        wrapperRef.current.style.display = 'flex'

        // need small setTimeout to give the wrapper time to update its display style...JK
        setTimeout(() => {
          setChildComponent(children)
          setKillChild(true)
          setShow(true)
        }, 10)

        if (container) container.style.overflow = 'hidden'
      } else {
        if (!isNested) {
          if (container) container.style.overflow = 'auto'
        }
        if (killChild) {
          setTimeout(() => {
            setChildComponent(null)
            setKillChild(false)
            setShow(false)

            // manualy set wrapper back to display none once modal is closed and finished animating...JK
            if (wrapperRef?.current) wrapperRef.current.style.display = 'none'
          }, TIMING)
        }
      }
    }, [children, isNested, killChild, open])

    return (
      <Wrapper
        animationType={animationType}
        className={className}
        full={full}
        open={open && show}
        ref={wrapperRef}
        sidebar={sidebar}
        small={small}
        xl={xl}
      >
        <Content
          animationType={animationType}
          bgColor={bgColor}
          full={full}
          id={id}
          open={open}
          ref={modalRef}
          shrink={shrink}
          sidebar={sidebar}
          small={small}
          xl={xl}
        >
          {handleClose && (
            <CloseIconWrapper onClick={handleClose} sidebar small>
              <CloseIcon />
            </CloseIconWrapper>
          )}
          {childComponent}
        </Content>
      </Wrapper>
    )
  }
)

Modal.displayName = 'Modal'

Modal.propTypes = {
  animationType: PropTypes.oneOf(['fadeIn', 'slideDown', 'slideLeft', 'slideRight', 'slideUp']),
  bgColor: PropTypes.string,
  children: PropTypes.any,
  className: PropTypes.string,
  full: PropTypes.bool,
  handleClose: PropTypes.func,
  id: PropTypes.string,
  isNested: PropTypes.bool,
  onClickOut: PropTypes.func,
  open: PropTypes.bool,
  shrink: PropTypes.bool,
  sidebar: PropTypes.bool,
  small: PropTypes.bool,
  xl: PropTypes.bool,
}

export default Modal
