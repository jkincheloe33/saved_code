import { useEffect, useState } from 'react'

import { colors } from '@assets'
import { ChallengesEditor, TabBar } from '@components'
import { api } from '@services'

const TAB_KEYS = {
  GENERAL: 0,
  IMAGES: 1,
  CHALLENGES: 2,
}

const TABS = ['General', 'Theme Images', 'Challenges']

let lastNewId = 0

const ChallengeThemesEditor = () => {
  const [challengeThemes, setChallengeThemes] = useState([])
  const [contextMenu, setContextMenu] = useState()
  const [currentTab, setCurrentTab] = useState(TAB_KEYS.GENERAL)
  const [originalSelectedRecord, setOriginalSelectedRecord] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [themeImages, setThemeImages] = useState()

  useEffect(() => {
    async function loadThemes() {
      // On initial load, get the challenge themes...EK
      const { data } = await api.get('/config/challengeThemes/list')
      setChallengeThemes(data.challengeThemesForAccount)
      setTimeout(() => {
        const firstRecord = data.challengeThemesForAccount[0]
        setSelectedRecord(firstRecord)
        _getRelatedItems(firstRecord)
      }, 0)
    }

    loadThemes()
  }, [])

  const _getRelatedItems = async challengeTheme => {
    const {
      data: { imageOptionsForTheme, success },
    } = await api.post('/config/challengeThemes/listMedia', { challengeThemeId: challengeTheme.id })

    if (success) setThemeImages(imageOptionsForTheme)
  }

  const newTheme = async () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    const newChallengeTheme = {
      id: --lastNewId,
      name: 'New Theme',
      description: '',
    }

    const { data: insertRes } = await api.post('/config/challengeThemes/save', { inserted: newChallengeTheme })
    newChallengeTheme.id = insertRes.newId

    setChallengeThemes([...challengeThemes, newChallengeTheme])

    setTimeout(() => {
      // Select the newly created challenge theme...EK
      const selRecord = challengeThemes.find(ct => ct.id === newChallengeTheme.id)
      setSelectedRecord(selRecord)
      setOriginalSelectedRecord(selRecord)
    }, 0)
  }

  const handleEdit = (property, value) => {
    setSelectedRecord(prev => ({ ...prev, [property]: value }))
  }

  const saveFieldEdits = async () => {
    // Compare edit vs original to see if there are changes to be made...EK
    if (JSON.stringify(selectedRecord) !== JSON.stringify(originalSelectedRecord)) {
      await api.post('/config/challengeThemes/save', { updated: selectedRecord })
      setOriginalSelectedRecord(selectedRecord)

      // Merge back into the list array...EK
      let indexOfRecord = challengeThemes.findIndex(ct => ct.id === selectedRecord.id)
      setChallengeThemes([...challengeThemes.slice(0, indexOfRecord), selectedRecord, ...challengeThemes.slice(indexOfRecord + 1)])
    }

    // ELSE: No changes detected...EK
  }

  const deleteTheme = async () => {
    if (selectedRecord == null) {
      alert('No record selected to delete.')
    }

    if (confirm(`About to Delete '${selectedRecord.name}'.  Are you sure you want to do this?`)) {
      let { data: deletedRes } = await api.post('/config/challengeThemes/save', { deleted: selectedRecord })
      if (deletedRes.success) {
        setChallengeThemes(challengeThemes.filter(r => r.id !== selectedRecord.id))
        setSelectedRecord(null)
        setOriginalSelectedRecord(null)
      } else {
        alert(deletedRes.msg)
      }
    }
  }

  const renderGeneralTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: 5 }}>
        <label>Name</label>
        <input name='name' value={selectedRecord.name || ''} onChange={e => handleEdit('name', e.target.value)} onBlur={saveFieldEdits} />
        <br />
        <label>Description</label>
        <textarea
          name='description'
          value={selectedRecord.description || ''}
          onChange={e => handleEdit('description', e.target.value)}
          onBlur={saveFieldEdits}
        />
        <br />
        <label>Challenge Template Title</label>
        <input
          name='templateTitle'
          value={selectedRecord.templateTitle || ''}
          onChange={e => handleEdit('templateTitle', e.target.value)}
          onBlur={saveFieldEdits}
        />
        <br />
        <label>Challenge Template Description</label>
        <textarea
          name='templateDescription'
          value={selectedRecord.templateDescription || ''}
          onChange={e => handleEdit('templateDescription', e.target.value)}
          onBlur={saveFieldEdits}
        />
        <br />
      </div>
    )
  }

  const renderImagesTab = () => {
    return (
      <div>
        <div>
          <input hidden id='challenges-upload-image' type='file' />
          <button
            onClick={() => {
              const fileInput = document.getElementById('challenges-upload-image')

              fileInput.onchange = async () => {
                // Push the file to the server...EK
                const formData = new FormData()
                formData.append('challengeThemeId', selectedRecord.id)
                formData.append('mediaUpload', fileInput.files[0])

                const { data: mediaSaveRes } = await api.post('/config/challengeThemes/saveMedia', formData)

                if (mediaSaveRes.success === true) {
                  setThemeImages([...themeImages, mediaSaveRes.media])
                } else {
                  console.error('Media Save Issue: ', mediaSaveRes.msg)
                }

                fileInput.value = null
              }

              fileInput.click()
            }}
          >
            New Image
          </button>
        </div>
        <span>Images available for this theme:</span>
        <div style={{ display: 'flex' }}>
          {themeImages &&
            themeImages.map(themeImg => {
              return <img key={themeImg.id} src={themeImg.imageOption} />
            })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <button onClick={newTheme}>New Theme</button>
        <button onClick={deleteTheme}>Delete Theme</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ height: '100%', width: '300px', marginRight: '5px', backgroundColor: '#fff' }}>
          {challengeThemes.map(ct => {
            return (
              <div
                key={ct.id}
                style={{
                  backgroundColor: '#f1f1f1',
                  padding: 5,
                  cursor: 'pointer',
                  color: selectedRecord && selectedRecord.id === ct.id ? colors.blurple : '#000',
                }}
                onClick={() => {
                  setSelectedRecord(ct)
                  setOriginalSelectedRecord(ct)
                  _getRelatedItems(ct)
                }}
              >
                {ct.name}
              </div>
            )
          })}
        </div>

        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <span style={{ fontSize: 30 }}>{selectedRecord.name}</span>
            <br />

            <TabBar options={TABS} setSelected={setCurrentTab} selected={currentTab} />

            <div style={{ marginTop: 5 }}>
              {currentTab === TAB_KEYS.GENERAL && renderGeneralTab()}
              {currentTab === TAB_KEYS.IMAGES && renderImagesTab()}
              {currentTab === TAB_KEYS.CHALLENGES && (
                <ChallengesEditor selectedRecord={selectedRecord} setContextMenu={setContextMenu} themeImages={themeImages} />
              )}
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div style={{ left: '0px', top: '0px', right: '0px', bottom: '0px', position: 'absolute' }} onClick={() => setContextMenu(null)}>
          <div
            style={{
              position: 'absolute',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              background: '#d1d1d1d1',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {contextMenu.renderMenu()}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChallengeThemesEditor
