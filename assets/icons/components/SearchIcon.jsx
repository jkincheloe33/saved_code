import PropTypes from 'prop-types'

export const SearchIcon = ({ className, color, ...props }) => (
  <svg {...props} className={className} fill='none' height='100%' viewBox='0 0 29 29' width='100%' xmlns='http://www.w3.org/2000/svg'>
    <title>Search Icon</title>

    <path
      d='M27.245 23.683l-8.093-7.794a9.323 9.323 0 001.67-5.323c0-5.31-4.485-9.629-9.998-9.629-5.514 0-10 4.32-10 9.63 0 5.308 4.486 9.628 10 9.628 2.042 0 3.943-.593 5.527-1.61l8.094 7.794c.374.36.871.558 1.4.558.529 0 1.026-.198 1.4-.558a1.86 1.86 0 000-2.696zm-16.422-4.504c-4.932 0-8.944-3.864-8.944-8.613 0-4.75 4.012-8.613 8.944-8.613 4.933 0 8.945 3.864 8.945 8.613 0 4.75-4.012 8.613-8.945 8.613zM26.5 25.661a.938.938 0 01-.654.26.938.938 0 01-.654-.26l-7.985-7.689c.476-.38.914-.802 1.309-1.26l7.984 7.689a.87.87 0 010 1.26z'
      fill={color || '#BDBDBD'}
      stroke='#8F949C'
      strokeWidth='.4'
    />
  </svg>
)

SearchIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default SearchIcon
