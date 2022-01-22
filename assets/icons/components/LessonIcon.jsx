import PropTypes from 'prop-types'

export const LessonIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 35 19'>
    <title>Notifications</title>
    <path
      d='M34.04 6.97L18.57.358a1.586 1.586 0 00-1.204.005L1.91 6.97a1.565 1.565 0 000 2.872l.415.178v3.955a2.041 2.041 0 101.36 0V10.6l3.403 1.453v4.517c0 1.128.914 2.042 2.041 2.042H26.82a2.041 2.041 0 002.041-2.042v-4.517l5.177-2.212a1.565 1.565 0 000-2.872h.003zM3.005 16.571a.68.68 0 110-1.36.68.68 0 010 1.36zm23.816.68H9.128a.68.68 0 01-.68-.68V11.52a1.372 1.372 0 01.83-1.255c1.236-.537 3.749-1.178 8.696-1.178 4.948 0 7.46.64 8.696 1.178.502.216.828.709.83 1.255v5.052a.68.68 0 01-.68.68zm6.686-8.66l-4.797 2.048a2.74 2.74 0 00-1.497-1.623c-1.354-.588-4.056-1.29-9.238-1.29-5.181 0-7.884.702-9.24 1.292a2.74 2.74 0 00-1.497 1.623l-3.96-1.695-.01-.005-.827-.351a.204.204 0 010-.368l15.446-6.6a.22.22 0 01.157-.005l15.465 6.605a.204.204 0 010 .368h-.002z'
      fill={color || '#664DFF'}
      stroke={color || '#664DFF'}
    />
  </svg>
)

LessonIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default LessonIcon
