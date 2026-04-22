import { MbtaData } from './mbta-data'
import { MbtaRender } from './mbta-render'
import * as mbtaUi from './mbta-ui'

const mbtaData = new MbtaData()
await mbtaData.init()

mbtaUi.populateRouteFilters(mbtaData)
mbtaUi.updateAlertInfo(mbtaData)
mbtaUi.updateGeneralInfo(mbtaData)

const mbtaRender = new MbtaRender()
mbtaRender.init(mbtaData)

mbtaRender.renderScene()

const liveUpdatesButton = document.getElementById(`liveUpdates`)
let liveUpdatesEnabled = false
liveUpdatesButton.addEventListener(`click`, () => {
  if (liveUpdatesEnabled) {
    liveUpdatesButton.textContent = `Enable live updates`
  } else {
    liveUpdatesButton.textContent = `Disable live updates`
  }
  liveUpdatesEnabled = !liveUpdatesEnabled
})

const VEHICLE_UPDATE_INTERVAL_MS = 4500
setInterval(async () => {
  if (liveUpdatesEnabled) {
    console.log(`Updating vehicles...`)
    mbtaData.updateVehicles()
    mbtaUi.updateGeneralInfo(mbtaData)
    mbtaRender.updateVehicleMeshes(mbtaData)
  }
}, VEHICLE_UPDATE_INTERVAL_MS)

const ALERT_UPDATE_INTERVAL_MS = 180000
setInterval(async () => {
  if (liveUpdatesEnabled) {
    mbtaData.updateAlerts()
    mbtaUi.updateGeneralInfo(mbtaData)
    mbtaUi.updateAlertInfo(mbtaData)
  }
}, ALERT_UPDATE_INTERVAL_MS)
