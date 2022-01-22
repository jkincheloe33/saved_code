import { api } from '@services'
import PropTypes from 'prop-types'

const ImportExportConfig = ({ setIsBusy }) => {
  const exportConfigToFile = async () => {
    // We post here because there will eventually be the ability to specify complex arguments...EK
    setIsBusy(true)
    const { data } = await api.post('/config/bulk/exportConfig', {}, { responseType: 'blob' })
    setIsBusy(false)

    // The data is pulled as a blob. we take that blob and download with a temp link...EK
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url

    link.setAttribute('download', 'config_export.json')

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importFromFile = () => {
    let fileInput = document.getElementById('upload-config')

    fileInput.onchange = async () => {
      // Push the file to the server...EK
      let formData = new FormData()
      formData.append('configUpload', fileInput.files[0])

      setIsBusy(true)
      const { data: configImportRes } = await api.post('/config/bulk/importConfig', formData)
      setIsBusy(false)

      console.log('configImportRes', configImportRes)
      if (configImportRes.success === true) {
        const importDetail = `
Import completed (Any value < 0 check server logs):
${configImportRes.challenges} Challenges
${configImportRes.cpcTypes} Wambi Types
${configImportRes.lessons} Lessons
${configImportRes.reactions} Reactions
${configImportRes.rewardTriggers} Reward Triggers
        `
        alert(importDetail)
      } else {
        alert(`Import did not complete successfully.  Message: ${configImportRes.msg}`)
      }

      fileInput.value = null
    }

    fileInput.click()
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <button onClick={exportConfigToFile}>Export To File</button>
        <input accept='application/json' id='upload-config' type='file' hidden />
        <button onClick={importFromFile}>Import From File</button>
      </div>
    </div>
  )
}

ImportExportConfig.propTypes = {
  setIsBusy: PropTypes.func,
}

export default ImportExportConfig
