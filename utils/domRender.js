import { Image } from '@components'
import styled from 'styled-components'
import { uId } from './general'

const ReactionImg = styled(Image)`
  max-width: 25px;
  min-width: 18px;
`

export const domRender = content => {
  // Tokenize all dom element in content...CY
  const contentDoms = content.match(/(<\s*(b|img)[^>]*>.*?<\s*\/\s*(b|img)>)/g)

  // Index all dom elements with markers example:[0]...CY
  const contentWithMarkers = contentDoms ? contentDoms.reduce((acc, e, i) => acc.replace(e, `[${i}]`), content) : content
  const contentMap = contentWithMarkers.split(' ').map((e, i) => {
    const indexMarkerRegex = /\[(.+)\]/

    // Return dom element if index marker exist...CY
    if (indexMarkerRegex.test(e)) {
      // Tokenize index from index marker
      const [, index] = e.match(indexMarkerRegex)

      // Tokenize dom element and content...CY
      const [, domElement, domContent] = contentDoms[index].match(/<(.+)>(.+)<\/.+>/)

      if (domElement === 'b') return <b key={uId('notification-bold-text')}>{domContent}</b>
      else if (domElement === 'img') return <ReactionImg key={uId('notification-image')} src={domContent} />
    }
    // Return text if no index marker exist...CY
    return i === 0 ? `${e} ` : ` ${e} `
  })
  return contentMap
}
