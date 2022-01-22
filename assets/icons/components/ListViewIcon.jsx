import PropTypes from 'prop-types'

import { colors } from '@assets'

export const ListViewIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} viewBox='0 0 16.2 16.2' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M14.5 0c.4 0 .9.2 1.2.5s.5.7.5 1.2v3.5c0 .4-.2.9-.5 1.2s-.7.4-1.2.4H1.7c-.4 0-.9-.2-1.2-.5S0 5.5 0 5.1V1.7C0 1.3.2.8.5.5S1.2 0 1.7 0h12.8zm0 1.1H1.7c-.1 0-.3.1-.4.2-.1.1-.2.2-.2.4v3.5c0 .3.2.6.6.6h12.9c.1 0 .3-.1.4-.2.1-.1.2-.2.2-.4V1.7c0-.1-.1-.3-.2-.4-.2-.1-.3-.2-.5-.2zM14.5 9.4c.4 0 .9.2 1.2.5.3.3.5.7.5 1.2v3.5c0 .4-.2.9-.5 1.2-.3.3-.7.5-1.2.5H1.7c-.4 0-.9-.2-1.2-.5-.3-.4-.5-.8-.5-1.3V11c0-.4.2-.9.5-1.2.3-.3.7-.5 1.2-.5h12.8zm0 1.1H1.7c-.1 0-.3.1-.4.2-.1.1-.2.2-.2.4v3.5c0 .3.2.6.6.6h12.9c.1 0 .3-.1.4-.2.1-.1.2-.2.2-.4v-3.5c0-.1-.1-.3-.2-.4-.2-.1-.3-.2-.5-.2z'
      fill={color || colors.gray3}
    />
  </svg>
)

ListViewIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default ListViewIcon
