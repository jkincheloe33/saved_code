import PropTypes from 'prop-types'

import { colors } from '@assets'

const DonutChart = ({ active, values }) => {
  // adds up all ratings before the current index and subtracts it from 100 to give you the correct offset...JK
  const getOffset = i => {
    if (i === 0) return 0
    const previous = values.slice(0, i).map(value => getPercentage(value.rating))
    return 100 - previous.reduce((a, b) => a + b, 0)
  }

  // rating is a decimal and needs to converted to a percentage based number out of 100...JK
  const getPercentage = rating => 100 * rating

  return (
    <svg width='100%' height='100%' viewBox='0 0 42 42'>
      {values.map((value, i) => {
        const rating = getPercentage(value.rating)
        const offset = getOffset(i)
        return (
          <circle
            cx='21'
            cy='21'
            key={i}
            r={100 / (2 * Math.PI)}
            fill='transparent'
            stroke={colors[value.backgroundColor]}
            strokeDasharray={`${rating} ${100 - rating}`}
            strokeDashoffset={offset}
            strokeWidth={i === active ? 5 : 3.5}
          />
        )
      })}
    </svg>
  )
}

DonutChart.propTypes = {
  active: PropTypes.number,
  values: PropTypes.array,
}

export default DonutChart
