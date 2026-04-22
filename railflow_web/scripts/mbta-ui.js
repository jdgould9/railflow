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

const routeFilterSelection = document.getElementById(`routeFilterSelection`)
export function populateRouteFilters (mbtaData) {
  mbtaData.routeIds.forEach(rId => {
    const routeFilterItem = document.createElement(`option`)
    routeFilterItem.value = rId
    routeFilterItem.textContent = rId
    routeFilterItem.selected = true
    routeFilterSelection.appendChild(routeFilterItem)
  })
}

// TODO:
// Implement route filtering
const filterVehiclesByRouteButton = document.getElementById(`routeFilterButton`)
filterVehiclesByRouteButton.addEventListener(`click`, () => {
  const selectedRouteFilters = []
  for (const o of routeFilterSelection.options) {
    if (o.selected) {
      selectedRouteFilters.push(o.value)
    }
  }
})

const generalInfoText = document.getElementById(`generalInfoText`)
export function updateGeneralInfo (mbtaData) {
  generalInfoText.textContent = `${mbtaData.vehicles.size} vehicles |
   ${mbtaData.stops.size} stops |
   Last update: ${mbtaData.lastUpdatedTime}  `
}

// TODO:
// selectionInfoText should update as live updates come in (track currently selected meshes userData?)
const selectionInfoText = document.getElementById(`selectionInfoText`)
export function updateSelectionInfo (userData) {
  switch (userData.type) {
    case 'vehicle':
      selectionInfoText.textContent = `Vehicle |
        ID: ${userData.id} |
        Route: ${userData.route} |
        Latitude: ${userData.latitude} |
        Longitude: ${userData.longitude} |
        Bearing: ${userData.bearing} |
        Updated at: ${userData.updatedAt}`
      break
    case 'stop':
      selectionInfoText.textContent = `Stop |
      ID: ${userData.id} |
      Name: ${userData.name} |
      Address: ${userData.address} |
      Latitude: ${userData.latitude} |
      Longitude: ${userData.longitude}`
      break
  }
}
