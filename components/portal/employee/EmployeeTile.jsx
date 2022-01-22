import PropTypes from 'prop-types'
import styled, { keyframes } from 'styled-components'

import { devices } from '@assets'
import { Card as CardBase, InitialsBox as InitialsBoxBase, Paragraph, Text } from '@components'

const slideUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-100px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`

const Card = styled(CardBase)`
  height: 100%;
  overflow: hidden;
  width: 98px;

  @media (${devices.smMobile}) {
    width: auto;
  }
`

const Container = styled.div`
  padding: 20px 5px;
  text-align: center;
`

const Image = styled.div`
  background: url(${p => p.image}) no-repeat;
  background-position: center;
  background-size: ${p => (p.hasImage ? 'cover' : '45%')};
  height: ${p => (p.single ? '44vw' : '29vw')};
  max-height: ${p => (p.single ? '205px' : 'none')};

  @media (${devices.tablet}) {
    ${p => !p.single && 'height: 22vw;'}
  }

  @media (${devices.desktop}) {
    ${p => !p.single && 'height: 150px;'}
  }
`

const InitialsBox = styled(InitialsBoxBase)`
  max-height: ${p => (p.single ? '205px' : 'none')};
  min-height: 0;

  @media (${devices.tablet}) {
    ${p => !p.single && 'height: 22vw;'}
  }

  @media (${devices.desktop}) {
    ${p => !p.single && 'height: 150px;'}
  }
`

const Wrapper = styled.div`
  animation: ${slideUp} 0.8s ease;
  cursor: pointer;
  flex: 0 0 50%;
  padding: 15px;
  width: 50%;

  @media (${devices.tablet}) {
    flex: 0 0 ${100 / 3}%;
    padding: 12px;
    width: ${100 / 3}%;
  }

  @media (${devices.desktop}) {
    flex: 0 0 25%;
    width: 25%;
  }
`

const EmployeeTile = ({ className, handleClick, image, index, name, single = false, title }) => (
  <Wrapper className={className} id={`employee-tile-${index}`} onClick={handleClick}>
    <Card>
      {image && image.length === 2 ? (
        <InitialsBox fontSize={single ? '72px' : '44px'} height={single ? '44vw' : '29vw'} initials={image} single={single} />
      ) : (
        <Image hasImage={image && true} image={image} single={single} />
      )}{' '}
      <Container>
        <Paragraph fontSize={['14px', '16px']} fontWeight={700} maxLines={1}>
          {name}
        </Paragraph>
        <Text fontSize={['14px', '16px']}>{title}</Text>
      </Container>
    </Card>
  </Wrapper>
)

EmployeeTile.propTypes = {
  className: PropTypes.string,
  handleClick: PropTypes.func,
  image: PropTypes.string,
  index: PropTypes.number,
  name: PropTypes.string,
  single: PropTypes.bool,
  title: PropTypes.string,
}

export default EmployeeTile
