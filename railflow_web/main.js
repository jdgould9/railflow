/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
UTILITY
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

function getRandom (min, max) {
  return Math.random() * (max - min) + min
}

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
CLASSES
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

class Route {
  constructor (id, color, description) {
    this.id = id
    this.color = color
    this.description = description
    this.type = `route`
  }
}

class Stop {
  constructor (id, route, longitude, latitude) {
    this.id = id
    this.route = [route]
    this.longitude = longitude
    this.latitude = latitude
    this.type = `stop`
  }
}

class Vehicle {
  constructor (id, route, longitude, latitude, bearing, updatedAt) {
    this.id = id
    this.route = route
    this.longitude = longitude
    this.latitude = latitude
    this.bearing = bearing
    this.updatedAt = updatedAt
    this.type = `vehicle`
  }
}

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
MBTA DATA
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

import timestamp from 'time-stamp'

/*
INFO
*/
let useStaticVehicles = true

let stopCount = 0
let vehicleCount = 0

function updateCountInfo () {
  const stopCountText = document.querySelector(`#stopCount`)
  stopCountText.textContent = `${stopCount} stops`
  const vehicleCountText = document.querySelector(`#vehicleCount`)
  vehicleCountText.textContent = `${vehicleCount} vehicles`
  const lastUpdatedTimeText = document.querySelector(`#lastUpdatedTime`)
  lastUpdatedTimeText.textContent = `Last updated: ${timestamp(
    `YYYY-MM-DDTHH:mm:ss`
  )}`
}

function updateSelectedInfo (node) {
  const selectionInfoText = document.querySelector(`#selectionInfo`)
  switch (node.userData.type) {
    case `stop`:
      selectionInfoText.innerHTML = `
            Name: ${node.userData.id} |
            Type: Stop | <br>
            Route: ${node.userData.route} |
            Longitude: ${node.userData.longitude} |
            Latitude: ${node.userData.latitude}`
      break
    case `vehicle`:
      selectionInfoText.innerHTML = `
            Name: ${node.userData.id} |
            Type: Vehicle | <br>
            Route: ${node.userData.route} |
            Longitude: ${node.userData.longitude} |
            Latitude: ${node.userData.latitude} |
            Bearing: ${node.userData.bearing} |
            Updated at: ${node.userData.updatedAt} 
            `
      break
  }
}

/*
ROUTES
*/
async function getMbtaRouteInfo () {
  const url = `./static_mbta_info/routes/routes.json`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }
    const jsonResult = await response.json()
    return jsonResult
  } catch (error) {
    console.error(error.message)
  }
}

function buildRouteMap (jsonResult, routes) {
  jsonResult.data.forEach(route => {
    routes.set(
      route.id,
      new Route(route.id, route.attributes.color, route.attributes.description)
    )
  })
}

async function buildRoutes () {
  const routes = new Map()
  const jsonResult = await getMbtaRouteInfo()
  buildRouteMap(jsonResult, routes)
  return routes
}

/*
STOPS
*/
async function getMbtaStopInfo (routeFilter) {
  const url = `./static_mbta_info/stops/${routeFilter}.json`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }
    const jsonResult = await response.json()
    return jsonResult
  } catch (error) {
    console.error(error.message)
  }
}

function buildStopMap (jsonResult, stops, route) {
  jsonResult.data.forEach(stop => {
    if (!stops.has(stop.id)) {
      stopCount++
      stops.set(
        stop.id,
        new Stop(
          stop.id,
          route,
          stop.attributes.longitude,
          stop.attributes.latitude
        )
      )
    } else {
      stops.get(stop.id).route.push(route)
    }
  })
}

async function buildStops (routeFilters) {
  const stops = new Map()
  for (const route of routeFilters) {
    const jsonResult = await getMbtaStopInfo(route)
    buildStopMap(jsonResult, stops, route)
  }
  return stops
}

/*
VEHICLES
*/
async function getMbtaVehicleInfo (routeFilters) {
  let url
  if (useStaticVehicles) {
    url = `./static_mbta_info/vehicles/Red_Orange_Blue.json`
  } else {
    url = `https://api-v3.mbta.com/vehicles?filter[route]=`
    for (const route of routeFilters) {
      url += `${route},`
    }
  }
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }
    const jsonResult = await response.json()
    return jsonResult
  } catch (error) {
    console.error(error.message)
  }
}

function buildVehicleObjects (jsonResult, vehicles) {
  jsonResult.data.forEach(vehicle => {
    vehicleCount++
    vehicles.push(
      new Vehicle(
        vehicle.id,
        vehicle.relationships.route.data.id,
        vehicle.attributes.longitude,
        vehicle.attributes.latitude,
        vehicle.attributes.bearing,
        vehicle.attributes.updated_at
      )
    )
  })
}

async function buildVehicles (routeFilters) {
  const vehicles = []
  const jsonResult = await getMbtaVehicleInfo(routeFilters)
  buildVehicleObjects(jsonResult, vehicles)
  return vehicles
}

/*
MAIN
*/
const selectedRouteFilters = [`Red`, `Orange`, `Blue`]
async function initMbta (routeFilters) {
  const routes = await buildRoutes()
  const stops = await buildStops(routeFilters)
  const vehicles = await buildVehicles(routeFilters)

  console.log(`Routes:`)
  console.log(routes)
  console.log(`Stops:`)
  console.log(stops)
  console.log(`Vehicles:`)
  console.log(vehicles)

  updateCountInfo()

  return {
    routes: routes,
    stops: stops,
    vehicles: vehicles
  }
}

const mbtaInfo = await initMbta(selectedRouteFilters)

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
THREE.JS RENDERING
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { time } from 'three/src/nodes/TSL.js'

/*
PICKING
*/
class PickHelper {
  constructor () {
    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Line.threshold = 0.0001
    this.pickedObject = null
    this.pickedObjectSavedColor = 0
  }
  pick (normalizedPosition, scene, camera) {
    if (this.pickedObject) {
      this.pickedObject.material.color.setHex(this.pickedObjectSavedColor)
      this.pickedObject = null
    }

    this.raycaster.setFromCamera(normalizedPosition, camera)
    const intersects = this.raycaster.intersectObjects(scene.children)
    if (intersects.length) {
      this.pickedObject = intersects[0].object
      this.pickedObjectSavedColor = this.pickedObject.material.color.getHex()
      this.pickedObject.material.color.setHex(0xffffff)
      updateSelectedInfo(this.pickedObject)
    }
  }
}

const pickHelper = new PickHelper()
const pickPosition = { x: -100000, y: -100000 }

function setPickPosition (event, canvas) {
  const rect = canvas.getBoundingClientRect()
  pickPosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pickPosition.y = ((event.clientY - rect.top) / rect.height) * -2 + 1
}

function clearPickPosition () {
  pickPosition.x = -100000
  pickPosition.y = -100000
}

/*
APP
*/
function initApp () {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('rgb(37, 35, 48)')
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.set(0, 0, 0.5)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.update()
  return { renderer, scene, camera }
}

function render (renderer, scene, camera) {
  renderer.render(scene, camera)
  pickHelper.pick(pickPosition, scene, camera)
  requestAnimationFrame(() => render(renderer, scene, camera))
}

/*
GRAPH RENDERING
*/
function buildStopMesh (stop) {
  // todo: multi-route coloring that's not just white
  // todo: fix fucky coloring parameters
  // color handling:
  // IF a stop has multiple routes:
  // IF they are all the same color (Green-B, Green-C), just use that color
  // ELSE, split
  let color
  if (stop.route.length === 1) {
    color = new THREE.Color(`#${mbtaInfo.routes.get(stop.route[0]).color}`)
  } else {
    color = new THREE.Color(`#ffffff`)
  }
  const material = new THREE.MeshBasicMaterial({
    color: color
  })
  const geometry = new THREE.RingGeometry(0.005, 0.008)
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

function buildVehicleMesh (vehicle) {
  const color = new THREE.Color(`#${mbtaInfo.routes.get(vehicle.route).color}`)
  color.addScalar(0.3)
  const material = new THREE.MeshBasicMaterial({ color: color })
  const geometry = new THREE.ConeGeometry(0.003, 0.01, 3)
  const mesh = new THREE.Mesh(geometry, material)
  // convert bearing to radians, invert to match three.js CCW rotation to bearing CW rotation
  mesh.rotation.z = -1.0 * THREE.MathUtils.degToRad(vehicle.bearing)
  return mesh
}

function calculateCentroid (stops) {
  let sumLongitude = 0
  let sumLatitude = 0
  let count = 0

  stops.forEach(stop => {
    sumLongitude += stop.longitude
    sumLatitude += stop.latitude
    count++
  })

  return {
    centroidLongitude: sumLongitude / count,
    centroidLatitude: sumLatitude / count
  }
}

function calculateProjectedCoordinates (longitude, latitude, centroid) {
  const MAP_SCALE = 10.0
  let x = MAP_SCALE * (longitude - centroid.centroidLongitude)
  let y = MAP_SCALE * (latitude - centroid.centroidLatitude)
  let z = 0

  return { x: x, y: y, z: z }
}

function createStopMeshes (stops, centroid) {
  const stopMeshes = new THREE.Group()
  stops.forEach(stop => {
    const position = calculateProjectedCoordinates(
      stop.longitude,
      stop.latitude,
      centroid
    )
    const mesh = buildStopMesh(stop)
    mesh.userData = stop
    mesh.position.set(position.x, position.y, position.z)

    stopMeshes.add(mesh)
  })
  return stopMeshes
}

function createVehicleMeshes (vehicles, centroid) {
  const vehicleMeshes = new THREE.Group()
  vehicles.forEach(vehicle => {
    const position = calculateProjectedCoordinates(
      vehicle.longitude,
      vehicle.latitude,
      centroid
    )
    const mesh = buildVehicleMesh(vehicle)
    mesh.userData = vehicle
    mesh.position.set(position.x, position.y, position.z)

    vehicleMeshes.add(mesh)
  })
  return vehicleMeshes
}

function buildGeospatialVisualization (mbtaInfo, scene) {
  const centroid = calculateCentroid(mbtaInfo.stops)
  const stopMeshes = createStopMeshes(mbtaInfo.stops, centroid)
  const vehicleMeshes = createVehicleMeshes(mbtaInfo.vehicles, centroid)
  return {
    centroid: centroid,
    stopMeshes: stopMeshes,
    vehicleMeshes: vehicleMeshes
  }
}

let liveUpdates = false
async function updateVehicles (scene, sceneInfo) {
  if (!liveUpdates) {
    return
  }
  useStaticVehicles = false
  vehicleCount = 0

  mbtaInfo.vehicles = await buildVehicles(selectedRouteFilters)
  console.log(`Updated vehicles:`)
  console.log(mbtaInfo.vehicles)

  updateCountInfo()

  scene.remove(sceneInfo.vehicleMeshes)
  sceneInfo.vehicleMeshes = createVehicleMeshes(
    mbtaInfo.vehicles,
    sceneInfo.centroid
  )

  scene.add(sceneInfo.vehicleMeshes)
}

/*
MAIN
*/
function main () {
  const app = initApp()

  window.addEventListener(`mouseout`, clearPickPosition)
  window.addEventListener(`mouseleave`, clearPickPosition)
  window.addEventListener(`mousemove`, e =>
    setPickPosition(e, app.renderer.domElement)
  )

  const sceneInfo = buildGeospatialVisualization(mbtaInfo, app.scene)
  app.scene.add(sceneInfo.stopMeshes)
  app.scene.add(sceneInfo.vehicleMeshes)

  const updateVehiclesButton = document.querySelector(`#updateVehicles`)
  updateVehiclesButton.addEventListener('click', () => {
    updateVehicles(app.scene, sceneInfo)
  })

  const liveUpdateButton = document.querySelector(`#liveUpdates`)
  liveUpdateButton.addEventListener(`click`, () => {
    if (liveUpdates) {
      console.log('Disabling live updates')
      liveUpdates = false
    } else {
      console.log('Enabling live updates')
      liveUpdates = true
    }
  })

  setInterval(() => {
    updateVehicles(app.scene, sceneInfo)
  }, 5000)

  requestAnimationFrame(() => render(app.renderer, app.scene, app.camera))
}

main()
