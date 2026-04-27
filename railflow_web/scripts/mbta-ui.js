// FIXME: Alerts should be ordered by severity
const alertsList = document.getElementById(`alertsList`)
export function updateAlertInfo (mbtaData) {
  alertsList.innerHTML = ``
  mbtaData.alerts.forEach(a => {
    const alertListItem = document.createElement(`li`)
    alertListItem.textContent = `ID: ${a.id} |
    Severity: ${a.severity} |
    Effect: ${a.effect} |
    Service effect: ${a.serviceEffect} |
    Header: ${a.header} |
    Created at: ${a.createdAt}
    URL: ${a.url}`
    alertsList.appendChild(alertListItem)
  })
}

const generalInfoText = document.getElementById(`generalInformationText`)
export function updateGeneralInfo (mbtaData) {
  generalInformationText.textContent = `${mbtaData.vehicles.size} vehicles |

   Last update: ${mbtaData.lastUpdatedTime}  `
}

// FIXME: Live selectionInfoText updating
// selectionInfoText should update as live updates come in (track currently selected meshes userData?)
const selectedInformationText = document.getElementById(
  `selectedInformationText`
)
export function updateSelectionInfo (userData) {
  switch (userData.type) {
    case 'vehicle':
      selectedInformationText.textContent = `Vehicle |
        ID: ${userData.id} |
        Route: ${userData.route} |
        Latitude: ${userData.latitude} |
        Longitude: ${userData.longitude} |
        Bearing: ${userData.bearing} |
        Updated at: ${userData.updatedAt}`
      break
    case 'stop':
      selectedInformationText.textContent = `Stop |
      ID: ${userData.id} |
      Name: ${userData.name} |
      Address: ${userData.address} |
      Latitude: ${userData.latitude} |
      Longitude: ${userData.longitude}`
      break
  }
}
