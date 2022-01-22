import PropTypes from 'prop-types'

export const ChevronIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' height='8' width='15' xmlns='http://www.w3.org/2000/svg'>
    <title>Chevron Icon</title>
    <path
      d='M7.488 7.201c-.25 0-.492-.08-.684-.23L.386 1.975a.982.982 0 01-.381-.678.957.957 0 01.242-.731C.43.36.69.232.973.208c.282-.024.564.057.782.227l5.733 4.478L13.221.595c.11-.083.235-.145.37-.183a1.141 1.141 0 01.817.082c.124.063.233.148.321.25a.984.984 0 01.218.355.937.937 0 01-.082.796c-.071.12-.168.226-.286.309L8.162 7.032a1.126 1.126 0 01-.674.17z'
      fill={color || '#A3A9B5'}
    />
  </svg>
)

ChevronIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default ChevronIcon
