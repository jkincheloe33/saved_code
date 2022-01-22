import PropTypes from 'prop-types'

export const AnalyticsIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 19 17'>
    <title>Analytics</title>
    <path
      d='M18.395 3.877h0a.689.689 0 01.972.976s0 0 0 0l-4.639 4.614a.688.688 0 01-.973-.001l-.035.035.035-.035L10.67 6.38l-.035-.036-.036.036-6.051 6.051h0a.686.686 0 01-.974 0h0a.688.688 0 010-.973h0l6.574-6.574a.688.688 0 01.974 0s0 0 0 0l3.086 3.086.035.035.035-.035 4.117-4.094z'
      fill={color || '#BDBDBD'}
      stroke='#fff'
      strokeWidth='.5'
    />
    <path
      d='M1.573 16.535v.05H18.883a.689.689 0 110 1.377H.883a.689.689 0 01-.688-.688V1.024a.689.689 0 111.377 0v15.511z'
      fill={color || '#BDBDBD'}
      stroke='#fff'
      strokeWidth='.5'
    />
  </svg>
)

AnalyticsIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default AnalyticsIcon
