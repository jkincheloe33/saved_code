import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { MediaIcon } from '@assets'
import { Image } from '@components'

const FileInput = styled.input`
  display: none;
`

const FileTypeWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 34px 0 20px 0;
`

const Label = styled.label`
  cursor: pointer;
`

const FileUpload = forwardRef(({ children, className, fileType = 'image/*,video/*', id, onFileChange }, ref) => (
  <FileTypeWrapper className={className}>
    <Label htmlFor={id}>{children ?? <Image alt='file upload icon' src={MediaIcon} />}</Label>
    <FileInput accept={fileType} id={id} onChange={onFileChange} ref={ref} type='file' />
  </FileTypeWrapper>
))

FileUpload.displayName = 'FileUpload'

FileUpload.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  fileType: PropTypes.string,
  id: PropTypes.string,
  onFileChange: PropTypes.func,
}

export default FileUpload
