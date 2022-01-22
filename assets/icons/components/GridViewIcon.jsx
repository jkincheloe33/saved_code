import PropTypes from 'prop-types'

import { colors } from '@assets'

export const GridViewIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} data-name='Layer 1' viewBox='0 0 19 19' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M6.69 10.36a1.95 1.95 0 012 2v4.75a1.95 1.95 0 01-2 1.89H1.94a1.91 1.91 0 01-1.37-.57A1.91 1.91 0 010 17.06v-4.75a1.95 1.95 0 011.94-2zm10.37 0a1.95 1.95 0 011.94 2v4.75A1.95 1.95 0 0117.06 19h-4.75a1.95 1.95 0 01-2-1.94v-4.75a1.95 1.95 0 012-2zm-10.37 1.3H1.94a.64.64 0 00-.45.19.62.62 0 00-.19.46v4.75a.64.64 0 00.64.64h4.75a.62.62 0 00.46-.19.64.64 0 00.19-.45v-4.75a.65.65 0 00-.65-.65zm10.37 0h-4.75a.65.65 0 00-.65.65v4.75a.65.65 0 00.65.64h4.75a.65.65 0 00.64-.64v-4.75a.62.62 0 00-.19-.46.64.64 0 00-.45-.19zM6.69 0a1.95 1.95 0 012 1.94v4.75a1.95 1.95 0 01-1.95 2h-4.8a1.95 1.95 0 01-1.94-2V1.94A1.91 1.91 0 01.57.57 1.91 1.91 0 011.94 0zm10.37 0a1.91 1.91 0 011.37.57A1.91 1.91 0 0119 1.94v4.75a1.95 1.95 0 01-1.94 2h-4.75a1.95 1.95 0 01-2-1.95v-4.8a1.95 1.95 0 012-1.94zM6.69 1.3H1.94a.6.6 0 00-.45.19.6.6 0 00-.19.45v4.75a.65.65 0 00.64.65h4.75a.65.65 0 00.65-.65V1.94a.64.64 0 00-.19-.45.62.62 0 00-.46-.19zm10.37 0h-4.75a.62.62 0 00-.46.19.64.64 0 00-.19.45v4.75a.65.65 0 00.65.65h4.75a.64.64 0 00.45-.19.62.62 0 00.19-.46V1.94a.6.6 0 00-.19-.45.6.6 0 00-.45-.19z'
      fill={color || colors.gray3}
    />
  </svg>
)

GridViewIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default GridViewIcon
