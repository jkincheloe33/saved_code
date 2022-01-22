import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

import { ChevronIcon, colors, multiplier, pills } from '@assets'
import { Anchor, Text } from '@components'

const { disabled: disabledStyles, full, inverted: invertedStyles, primary, secondary, small, tertiary, thin } = pills

const Button = styled.button`
  align-items: center;
  background: none;
  border: none;
  display: flex;
  justify-items: center;
  width: 100%;
`

const Link = styled(Anchor)`
  display: block;

  span {
    color: inherit;
  }
`

const ScheduleWrapper = styled.div`
  border-left: 1px solid ${p => p.barColor};
  height: 100%;
  padding: ${multiplier + multiplier / 2}px 0 ${multiplier + multiplier / 2}px ${multiplier * 3}px;

  img {
    flex: 1;
  }
`

const TextWrapper = styled.div`
  flex: 1;
`

// prettier-ignore
const Wrapper = styled.div`
  ${primary.base}
  background: ${p => p.background ?? colors.blurple};

  ${Button}, ${Link} {
    ${primary.children}
  }

  ${Button}:focus, ${Link}:focus {
    outline: none;
  }

  ${p => p.buttonType === 'secondary' && css`

    ${secondary.base}

    ${Button}, ${Link} {
      ${secondary.children}
    }
  `}

  ${p => p.buttonType === 'tertiary' && css`
    ${tertiary.base}

    ${Button}, ${Link} {
      ${tertiary.children}
    }
  `}

  ${p => p.full && css`
    ${full.base}
  `}

  ${p => p.inverted && css`
    ${invertedStyles.base}

    ${Button}, ${Link} {
      ${invertedStyles.children}
    }
  `}

  ${p => p.small && css`
    ${small.base}

    ${Button}, ${Link} {
      ${small.children}
    }
  `}

  ${p => p.thin && css`
    ${Button}, ${Link} {
      ${thin.children}
    }
  `}

  &[disabled] {
    ${disabledStyles.base}

    ${Button}:disabled, ${Link}:disabled {
      ${disabledStyles.children}
    }
  }

  ${p => p.handleIconClick && css`
    ${Button}, ${Link} {
      padding: ${multiplier}px ${multiplier * 3}px
    }
  `}
`

const PillButton = forwardRef(
  (
    {
      background,
      buttonType = 'primary',
      className,
      children,
      clamp = false,
      disabled = false,
      full = false,
      handleIconClick,
      id,
      inverted = false,
      link,
      onClick,
      small,
      target = '_self',
      text,
      thin = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const barColor = disabled
      ? disabledStyles.children.color
      : buttonType === 'secondary'
      ? secondary.children.color
      : buttonType === 'tertiary'
      ? tertiary.children.color
      : inverted
      ? invertedStyles.children.color
      : primary.children.color
    return (
      <Wrapper
        background={background}
        buttonType={buttonType}
        className={className}
        disabled={disabled}
        full={full}
        handleIconClick={!!handleIconClick}
        inverted={inverted}
        ref={ref}
        small={small}
        thin={thin}
      >
        {link ? (
          <Link {...props} disabled={disabled} link={link} id={id} target={target} text={text} />
        ) : (
          <Button {...props} disabled={disabled} id={id} type={type}>
            <TextWrapper onClick={onClick}>
              {clamp ? <Text>{text}</Text> : text}
              {children}
            </TextWrapper>
            {handleIconClick && (
              <ScheduleWrapper barColor={barColor} onClick={handleIconClick}>
                <ChevronIcon color={barColor} />
              </ScheduleWrapper>
            )}
          </Button>
        )}
      </Wrapper>
    )
  }
)

PillButton.propTypes = {
  background: PropTypes.string,
  buttonType: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
  className: PropTypes.string,
  children: PropTypes.any,
  clamp: PropTypes.bool,
  disabled: PropTypes.bool,
  full: PropTypes.bool,
  handleIconClick: PropTypes.func,
  id: PropTypes.string,
  inverted: PropTypes.bool,
  link: PropTypes.string,
  onClick: PropTypes.func,
  small: PropTypes.bool,
  target: PropTypes.oneOf(['_blank', '_self']),
  text: PropTypes.string.isRequired,
  thin: PropTypes.bool,
  type: PropTypes.string,
}

PillButton.displayName = 'PillButton'

export default PillButton
