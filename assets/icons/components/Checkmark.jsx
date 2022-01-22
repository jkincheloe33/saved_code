import PropTypes from 'prop-types'

import { colors } from '@assets'

export const Checkmark = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 6'>
    <path
      d='M5.857.119a.476.476 0 00-.66.14L2.529 4.374 1.226 3.17a.476.476 0 10-.646.7l1.709 1.58s.05.042.072.057a.476.476 0 00.659-.14L5.997.777a.476.476 0 00-.14-.658z'
      fill={colors[color] ?? colors.gray3}
    />
  </svg>
)

Checkmark.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default Checkmark
