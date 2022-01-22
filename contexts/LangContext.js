import { createContext, useContext } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import { useAuthContext } from '@contexts'
import { defaultLanguages, translations, useStore } from '@utils'

const LangContext = createContext({})

const transMap = new Map(translations?.map(t => [t.en, t]))

const appLangs = [
  {
    code: 'en',
    name: 'English',
  },
  {
    code: 'es',
    name: 'Espa\u00F1ol',
  },
]

export const LangProvider = ({ children }) => {
  const { clientAccount } = useAuthContext()
  const { pathname } = useRouter()
  const [setStore, { lang }] = useStore()

  const setLang = async code => await setStore({ lang: code })

  const getText = text => {
    // Checking pathname makes sure we only apply translations to the portal...KA
    return transMap.has(text) && pathname === '/portal' ? transMap.get(text)[lang] || transMap.get(text)['en'] : text
  }

  //Get language for wambi app...CY
  const getAccountLanguage = type => {
    const accountLanguage = clientAccount?.languages.find(l => l.languageType === type)?.language
    return accountLanguage ?? defaultLanguages[type]
  }

  return <LangContext.Provider value={{ appLangs, getAccountLanguage, getText, lang, setLang }}>{children}</LangContext.Provider>
}

LangProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useLangContext = () => useContext(LangContext)
