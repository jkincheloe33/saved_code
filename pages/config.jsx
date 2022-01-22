import { useState } from 'react'
import styled from 'styled-components'

import GroupTypesGridEditor from '../components/config/GroupTypesGridEditor'

import { colors, devices } from '@assets'
import {
  AnalyticsEditor,
  AwardTypesGridEditor,
  ChallengeThemesEditor,
  ClientValuesGridEditor,
  GlobalSettingsEditor,
  GroupsTreeEditor,
  ImportExportConfig,
  InterestsGridEditor,
  LanguageEditor,
  Layout,
  LessonsEditor,
  Loader,
  MediaGridEditor,
  Modal,
  PeopleGridEditor,
  PeopleSelector,
  PortalEditor,
  QuestionSetsEditor,
  ReactionsGridEditor,
  RewardLevelsEditor,
  RewardTriggersEditor,
  TabBar,
  Title,
  TraitsGridEditor,
  WambisEditor,
} from '@components'
import { useUserContext } from '@contexts'
import { ACCOUNT_ACCESS_LEVELS } from '@utils'

const TAB_EDITORS = {
  GROUP_TYPES: 0,
  GROUPS_TREE: 1,
  TRAITS: 2,
  INTERESTS: 3,
  PEOPLE: 4,
  QUESTION_SETS: 5,
  AWARD_TYPES: 6,
  PORTALS: 7,
  REACTIONS: 8,
  CLIENT_VALUES: 9,
  CHALLENGES: 10,
  ANALYTICS: 11,
  MEDIA_LIBRARY: 12,
  WAMBIS: 13,
  LESSONS: 14,
  REWARD_LEVELS: 15,
  REWARD_TRIGGERS: 16,
  IMPORT_EXPORT: 17,
  LANGUAGE: 18,
  GLOBAL_SETTINGS: 19,
}

const TABS = [
  'Group Types',
  'Groups',
  'Traits',
  'Interests',
  'People',
  'Question Sets',
  'Award Types',
  'Portals',
  'Reactions',
  'Client Values',
  'Challenges',
  'Analytics',
  'Media Library',
  'Wambis',
  'Lessons',
  'Reward Levels',
  'Reward Triggers',
  'Import/Export',
  'Language',
]

const GLOBAL_TABS = ['Global Settings']

const AccessTitle = styled(Title)`
  margin-top: 50px;
`

const EditorWrapper = styled.div`
  display: flex;
  height: 75vh;
  margin: 5px;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  bottom: 0;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
`

const MobileWrapper = styled.div`
  display: block;
  padding-top: 50px;

  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const TabsWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 10px;

  ul {
    flex-wrap: wrap;
    justify-content: center;
    width: 90%;

    li {
      flex: auto;
      margin: 0 50px 10px 0;
    }
  }
`

const Wrapper = styled.div`
  display: none;

  @media (${devices.largeDesktop}) {
    display: block;
  }
`

const Config = () => {
  const { user } = useUserContext()
  const [currentTab, setCurrentTab] = useState(TAB_EDITORS.GROUP_TYPES)
  const [peopleSelectionHandler, setPeopleSelectionHandler] = useState()
  const [peopleSelectorOpen, setPeopleSelectorOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const _closePeopleSelector = () => {
    setPeopleSelectorOpen(false)
    setPeopleSelectionHandler()
  }

  const showPeopleSelector = data => {
    setPeopleSelectorOpen(true)
    setPeopleSelectionHandler(data)
  }

  return (
    <Layout full head='Config' scroll>
      <Wrapper>
        {user?.clientAccessLevel >= ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN ? (
          <>
            <TabsWrapper>
              <TabBar
                options={[...TABS, ...(user?.clientAccessLevel === ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN ? GLOBAL_TABS : [])]}
                selected={currentTab}
                setSelected={setCurrentTab}
              />
            </TabsWrapper>
            <EditorWrapper>
              {currentTab === TAB_EDITORS.GROUP_TYPES && <GroupTypesGridEditor />}
              {currentTab === TAB_EDITORS.GROUPS_TREE && <GroupsTreeEditor setIsBusy={setIsBusy} showPeopleSelector={showPeopleSelector} />}
              {currentTab === TAB_EDITORS.TRAITS && <TraitsGridEditor showPeopleSelector={showPeopleSelector} />}
              {currentTab === TAB_EDITORS.INTERESTS && <InterestsGridEditor />}
              {currentTab === TAB_EDITORS.PEOPLE && <PeopleGridEditor setIsBusy={setIsBusy} showPeopleSelector={showPeopleSelector} />}
              {currentTab === TAB_EDITORS.QUESTION_SETS && <QuestionSetsEditor />}
              {currentTab === TAB_EDITORS.AWARD_TYPES && <AwardTypesGridEditor />}
              {currentTab === TAB_EDITORS.PORTALS && <PortalEditor />}
              {currentTab === TAB_EDITORS.REACTIONS && <ReactionsGridEditor />}
              {currentTab === TAB_EDITORS.CLIENT_VALUES && <ClientValuesGridEditor />}
              {currentTab === TAB_EDITORS.CHALLENGES && <ChallengeThemesEditor />}
              {currentTab === TAB_EDITORS.ANALYTICS && <AnalyticsEditor />}
              {currentTab === TAB_EDITORS.MEDIA_LIBRARY && <MediaGridEditor />}
              {currentTab === TAB_EDITORS.WAMBIS && <WambisEditor />}
              {currentTab === TAB_EDITORS.LESSONS && <LessonsEditor />}
              {currentTab === TAB_EDITORS.REWARD_LEVELS && <RewardLevelsEditor />}
              {currentTab === TAB_EDITORS.REWARD_TRIGGERS && <RewardTriggersEditor />}
              {currentTab === TAB_EDITORS.IMPORT_EXPORT && <ImportExportConfig setIsBusy={setIsBusy} />}
              {currentTab === TAB_EDITORS.LANGUAGE && <LanguageEditor />}
              {user?.clientAccessLevel === ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN && currentTab === TAB_EDITORS.GLOBAL_SETTINGS && (
                <GlobalSettingsEditor />
              )}
            </EditorWrapper>
          </>
        ) : (
          <AccessTitle>ADMIN ACCESS RESTRICTED</AccessTitle>
        )}
      </Wrapper>
      <MobileWrapper>
        <Title>This page is not available on mobile</Title>
      </MobileWrapper>
      <Modal handleClose={_closePeopleSelector} open={peopleSelectorOpen}>
        <PeopleSelector selectionHandler={peopleSelectionHandler} handleClose={_closePeopleSelector} />
      </Modal>
      {isBusy && (
        <LoaderWrapper>
          <Loader />
        </LoaderWrapper>
      )}
    </Layout>
  )
}

export default Config
