import PropTypes from 'prop-types'

export const PersonIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' height='100%' viewBox='0 0 29 29' width='100%' xmlns='http://www.w3.org/2000/svg'>
    <title>My Profile</title>

    <path
      d='M2.953 27.385l.021.003h24.192l.014-.001a.82.82 0 00.047-.007l.01-.002.01-.002.018-.005.19-.047v-.196c-.003-.66-.399-2.52-2.092-4.213-1.638-1.638-4.683-3.305-10.29-3.305-5.609 0-8.652 1.667-10.29 3.305-1.693 1.693-2.086 3.552-2.091 4.212l-.002.208.205.04.058.01zm26.428-.247c0 .563-.14.969-.337 1.264a1.88 1.88 0 01-.738.636 2.733 2.733 0 01-1.082.276h-.019 0H2.941h0-.019l-.068-.003a2.733 2.733 0 01-1.015-.273 1.88 1.88 0 01-.737-.636c-.197-.295-.337-.7-.337-1.264 0-1.149.581-3.51 2.656-5.585 2.067-2.068 5.638-3.87 11.651-3.87s9.584 1.802 11.652 3.87c2.074 2.075 2.656 4.436 2.656 5.585zM15.073 12.832a5.103 5.103 0 100-10.206 5.103 5.103 0 000 10.206zm7.03-5.103a7.029 7.029 0 11-14.058 0 7.029 7.029 0 0114.057 0z'
      fill={color || '#BDBDBD'}
      stroke='#fff'
      strokeWidth='.5'
    />
  </svg>
)

PersonIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default PersonIcon
