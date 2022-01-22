import PropTypes from 'prop-types'

export const HubIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 19 25'>
    <title>Management Hub</title>
    <path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M11.626 2.866Zm6.34 2.574v16.72V5.44Zm-2.573-2.855h-3.59a2.95 2.95 0 0 0-5.238 0h-3.59A2.859 2.859 0 0 0 .12 5.44v16.698a2.859 2.859 0 0 0 2.856 2.855h12.417a2.859 2.859 0 0 0 2.855-2.855V5.44a2.859 2.859 0 0 0-2.855-2.855ZM7.166 4.319c.407 0 .76-.283.847-.681.114-.52.603-.91 1.171-.91.568 0 1.057.39 1.171.91.087.398.44.68.847.68h.88v.234a1.12 1.12 0 0 1-1.12 1.12H7.406a1.12 1.12 0 0 1-1.12-1.12v-.233h.88ZM9.36 2.456a1.512 1.512 0 0 0-.175-.01c-.694 0-1.302.476-1.446 1.131a.586.586 0 0 1-.572.46H6.004v.515-.514h1.162a.586.586 0 0 0 .572-.46c.144-.656.752-1.132 1.446-1.132.06 0 .117.004.175.01Zm3.005 1.582h-1.162 1.162ZM6.71 7.03c.222.062.456.095.697.096h3.556a2.577 2.577 0 0 0 2.574-2.574v-.514h1.857-1.857v.514a2.577 2.577 0 0 1-2.574 2.574H7.406a2.58 2.58 0 0 1-.697-.096ZM4.832 4.038H2.976c-.774 0-1.402.628-1.403 1.402v16.698V5.44a1.405 1.405 0 0 1 1.403-1.402h1.856Zm8.985.514v-.233h1.575c.62 0 1.12.502 1.122 1.121v16.698a1.122 1.122 0 0 1-1.122 1.12H2.976a1.12 1.12 0 0 1-1.121-1.12V5.44c0-.619.502-1.12 1.12-1.121h1.576v.233a2.859 2.859 0 0 0 2.855 2.855h3.556a2.858 2.858 0 0 0 2.855-2.855ZM12.084 12.1l-3.846 3.756-1.954-1.907a.586.586 0 0 0-.828.009l.004-.003a.586.586 0 0 1 .824-.006l1.954 1.907 3.846-3.756Zm1.029-.185a.867.867 0 0 0-1.224-.017l-3.651 3.565-1.757-1.715a.867.867 0 0 0-1.224 1.229l2.375 2.318a.867.867 0 0 0 1.211 0L13.1 13.14a.867.867 0 0 0 .013-1.224Z'
      fill={color || '#BDBDBD'}
    />
  </svg>
)

HubIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default HubIcon