import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Text } from '@components'
import { useLangContext } from '@contexts'

const Language = styled(Text)`
  color: ${p => (p.sidebar ? colors.darkBlue : colors.digitalBlue)};
  cursor: pointer;
  display: ${p => (p.active ? 'none' : 'block')};
  font-size: ${p => (p.sidebar ? '16px' : '14px')};
  font-weight: ${p => (p.sidebar ? 'bold' : 'normal')};
`

const LanguageSelector = ({ sidebar }) => {
  const { appLangs, lang, setLang } = useLangContext()

  return (
    <>
      {appLangs.map(({ code, name }) => (
        <Language active={code === lang && 'active'} id='language-selector' key={code} onClick={() => setLang(code)} sidebar={sidebar}>
          {name}
        </Language>
      ))}
    </>
  )
}

LanguageSelector.propTypes = {
  sidebar: PropTypes.bool,
}

export default LanguageSelector
