import PropTypes from 'prop-types'

export const HomeIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' height='100%' viewBox='0 0 29 25' width='100%' xmlns='http://www.w3.org/2000/svg'>
    <title>Home</title>
    <path
      d='M27.718 10.59L14.686.872a.704.704 0 00-.844 0L.81 10.59a.736.736 0 00-.155 1.017c.233.324.68.394.999.157l12.61-9.403 12.61 9.403a.702.702 0 00.998-.157.736.736 0 00-.154-1.017z'
      fill={color || '#BDBDBD'}
      stroke={color || '#BDBDBD'}
      strokeWidth='.5'
    />
    <path
      d='M27.328 10.464c-.515 0-.933.331-.933.74v11.78h-7.467v-6.43c0-2.041-2.094-3.701-4.667-3.701s-4.667 1.66-4.667 3.7v6.43H2.128v-11.78c0-.408-.418-.74-.933-.74-.516 0-.934.332-.934.74v12.52c0 .41.418.74.934.74h9.333c.49 0 .892-.3.93-.682a.454.454 0 00.003-.057v-7.17c0-1.225 1.256-2.221 2.8-2.221 1.544 0 2.8.996 2.8 2.22v7.17c0 .022.002.04.004.058.037.382.439.683.93.683h9.333c.515 0 .933-.332.933-.74v-12.52c0-.409-.418-.74-.933-.74z'
      fill={color || '#BDBDBD'}
      strokeWidth='0'
    />
  </svg>
)

HomeIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default HomeIcon
