import PropTypes from 'prop-types'

export const BadgeIcon = ({ className, ...props }) => (
  <svg {...props} className={className} fill='none' height='100%' viewBox='0 0 20 20' width='100%' xmlns='http://www.w3.org/2000/svg'>
    <title>Badge Icon</title>
    <path
      d='M17.965 6.521C17.988 6.347 18 6.173 18 6c0-2.379-2.143-4.288-4.521-3.965A3.995 3.995 0 0010 0a3.995 3.995 0 00-3.479 2.035C4.138 1.712 2 3.621 2 6c0 .173.012.347.035.521A3.998 3.998 0 000 10c0 1.465.802 2.785 2.035 3.479A3.977 3.977 0 002 14c0 2.379 2.138 4.283 4.521 3.965A3.995 3.995 0 0010 20a3.995 3.995 0 003.479-2.035C15.857 18.283 18 16.379 18 14c0-.173-.012-.347-.035-.521A3.998 3.998 0 0020 10a3.998 3.998 0 00-2.035-3.479z'
      fill='url(#paint0_linear)'
    />
    <defs>
      <linearGradient id='paint0_linear' x1='10' y1='0' x2='10' y2='20' gradientUnits='userSpaceOnUse'>
        <stop stopColor={'#9973FF'} />
        <stop offset='1' stopColor={'#3A1AFF'} />
      </linearGradient>
    </defs>
  </svg>
)

BadgeIcon.propTypes = {
  className: PropTypes.string,
}

export default BadgeIcon
