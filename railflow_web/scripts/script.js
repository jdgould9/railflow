import { MbtaData } from './mbta-data'
import { MbtaRender } from './mbta-render'
import * as mbtaUi from './mbta-ui'
import * as THREE from 'three'
import timestamp from 'time-stamp'

// TODO: Add Boston area backdrop
// TODO: Coordinates under cursor
// Add latitude/longitude coordinates under where the cursor is currently place

const mbtaData = new MbtaData()
await mbtaData.init()

mbtaUi.updateAlertInfo(mbtaData)
mbtaUi.updateGeneralInfo(mbtaData)

const mbtaRender = new MbtaRender()
mbtaRender.init(mbtaData)

// FIXME: Move live update controls to mbta-ui
const liveUpdatesButton = document.getElementById(`toggleLiveUpdates`)
let liveUpdatesEnabled = false
liveUpdatesButton.addEventListener(`click`, () => {
  liveUpdatesEnabled = !liveUpdatesEnabled
  console.log(`Live updates:`, liveUpdatesEnabled)
})

// TODO: Implement left panel controls
// FIXME: Move left panel controls to mbta-ui
const searchButton = document.getElementById(`search`)
searchButton.addEventListener(`click`, () => {
  console.log(`search`)
})

const filtersButton = document.getElementById(`filters`)
filtersButton.addEventListener(`click`, () => {
  console.log(`filters`)
})

const mapLayersButton = document.getElementById(`mapLayers`)
mapLayersButton.addEventListener(`click`, () => {
  console.log(`map layers`)
})

const bookmarksButton = document.getElementById(`bookmarks`)
bookmarksButton.addEventListener(`click`, () => {
  console.log(`bookmarks`)
})

// FIXME: Currently requires 'preserveDrawingBuffer: true' in renderer
// This is not optimal for performance
// See https://threejs.org/manual/#en/tips#screenshot for better fix
// FIXME: Currently low-res
// If zoomed out, screenshot is very low-res
// See https://discourse.threejs.org/t/what-is-the-alternative-to-take-high-resolution-picture-rather-than-take-canvas-screenshot/3209/7
const screenshotButton = document.getElementById(`screenshot`)
screenshotButton.addEventListener(`click`, async () => {
  console.log(`screenshot`)
  const canvas = mbtaRender.app.renderer.domElement
  const blob = await new Promise(resolve => canvas.toBlob(resolve))
  const a = document.createElement(`a`)
  document.body.appendChild(a)
  a.style.display = `none`
  const url = window.URL.createObjectURL(blob)
  a.href = url
  a.download = `railflow_screenshot_${timestamp(`YYYY-MM-DDTHH:mm:ss`)}`
  a.click()
})

// FIXME: This feels hacky
const downloadButton = document.getElementById(`download`)
downloadButton.addEventListener(`click`, async () => {
  const mbtaObject = {
    vehicles: Array.from(mbtaData.vehicles),
    alerts: Array.from(mbtaData.alerts),
    lastUpdatedTime: mbtaData.lastUpdatedTime
  }
  const json = JSON.stringify(mbtaObject)
  const blob = new Blob([json], { type: 'application/json' })
  const href = await URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = `railflow_mbtadata_${timestamp(`YYYY-MM-DDTHH:mm:ss`)}`
  link.position = 'absolute'
  link.left = '200vw'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
})

// TODO: Dark/Light toggle
// Should change scene background, stop mesh colors, CSS colors
// Also make it not look like shit
// Maybe store dark/light color palette in JSON? Easily reusable...
let darkmodeEnabled = true
const toggleDarkLightModeButton = document.getElementById(`toggleDarkLightMode`)
toggleDarkLightModeButton.addEventListener(`click`, () => {
  console.log(`Toggling dark/light mode`)
  if (darkmodeEnabled) {
    mbtaRender.app.scene.background = new THREE.Color(0xf1f0f4)
  } else {
    mbtaRender.app.scene.background = new THREE.Color(0x252330)
  }
  darkmodeEnabled = !darkmodeEnabled
})

// FIXME: Fullscreen barely works
// Doesn't preserve original size when untoggled
// Doesn't work correctly if window is not fully maximized
// Leaves big margin at bottom
const toggleFullScreenButton = document.getElementById(`toggleFullscreen`)
toggleFullScreenButton.addEventListener(`click`, () => {
  console.log(`Toggling fullscreen`)
  const elem = document.getElementById(`threeJsWindow`)
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.mozRequestFullScreen) {
    /* Firefox */
    elem.mozRequestFullScreen()
  } else if (elem.webkitRequestFullscreen) {
    /* Chrome, Safari & Opera */
    elem.webkitRequestFullscreen()
  } else if (elem.msRequestFullscreen) {
    /* IE/Edge */
    elem.msRequestFullscreen()
  }
  elem.style.width = `100%`
  elem.style.height = `100%`
  mbtaRender.app.renderer.setSize(window.innerWidth, window.innerHeight)
  mbtaRender.app.camera.aspect = window.innerWidth / window.innerHeight
  mbtaRender.app.camera.updateProjectionMatrix()
})

const aboutRailflowButton = document.getElementById(`aboutRailflow`)
aboutRailflowButton.addEventListener(`click`, () => {
  console.log(`About railflow`)
  window.alert(
    `railflow.live uses publicly available data provided by the Massachusetts \
Bay Transportation Authority (MBTA) but is not affiliated with, endorsed by, \
or sponsored by the MBTA.\nDeveloped by Jack Gould\njdgould9@gmail.com`
  )
})

const bookmarkSelectionButton = document.getElementById(`bookmarkSelection`)
bookmarkSelectionButton.addEventListener(`click`, () => {
  console.log(`bookmark selection`)
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

mbtaRender.renderScene()
/* Firefox */
