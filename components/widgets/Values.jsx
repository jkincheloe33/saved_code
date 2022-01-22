import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, shadows } from '@assets'
import { Text, Title } from '@components'
import { gradientGenerator } from '@utils'

const Container = styled.div`
  align-items: center;
  background-color: ${p => (p.active ? colors.white : 'transparent')};
  box-shadow: ${p => (p.active ? shadows.modal : 'none')};
  border-radius: 100px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 16px 16px 16px 20px;
  transition: all 250ms ease;

  &:not(:last-of-type) {
    margin-bottom: 10px;
  }
`

const Header = styled(Title)`
  margin-bottom: 20px;
`

const Progress = styled.div`
  background-color: ${colors.gray8};
  border-radius: 30px;
  flex: 0 0 53%;
  padding: 1.5px 0;
  position: relative;

  &::before {
    ${p => gradientGenerator(p.gradient)}
    background-color: ${colors.white};
    border-radius: 30px;
    content: '';
    height: 20px;
    left: 0;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: width 500ms cubic-bezier(0.37, 0.02, 0.07, 0.98);
    width: ${p => p.length}%;
  }
`

const Values = ({ active, setActive, values }) => {
  const [loaded, setLoaded] = useState(false)
  const [max, setMax] = useState(100)
  const getRating = rating => 100 * rating
  const getProgress = rating => (rating / max) * 100

  useEffect(() => {
    // returns the highest rating from the values array
    const highest = Math.max(...values.map(v => v.rating))
    setMax(highest)
  }, [values])

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <>
      <Header color='gray1' justifyContent='left' fontSize='18px'>
        Values Recognition Distribution
      </Header>
      {values.map((value, i) => (
        <Container active={active === i} key={i} onClick={() => setActive(i)}>
          <Text color='gray1' fontSize='15px' fontWeight={active === i ? 700 : 400}>
            {value.text} ({getRating(value.rating)})
          </Text>
          <Progress
            color={value.color}
            gradient={{
              colors: [
                {
                  color: value.color,
                  location: 0,
                },
                {
                  color: `${colors[value.color]}30`,
                  location: '100%',
                },
              ],
            }}
            length={loaded ? getProgress(value.rating) : 0}
          />
        </Container>
      ))}
    </>
  )
}

Values.propTypes = {
  active: PropTypes.number,
  setActive: PropTypes.func,
  values: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default Values
