import * as THREE from 'three'
import * as RenderUtils from './mbta-render-utils'
import { PickHelper } from './mbta-render-pick-helper'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { Text } from 'troika-three-text'

export class MbtaRender {
  constructor () {
    this.app = null
    this.sceneData = null
    this.pickHelper = new PickHelper()
  }
  init (mbtaData, pickHelper) {
    this.app = getApp()
    this.sceneData = getSceneData(mbtaData)
    this.app.scene.add(
      this.sceneData.stopMeshes,
      this.sceneData.vehicleMeshes,
      this.sceneData.tripShapeLines
    )
    window.addEventListener(`mouseout`, () =>
      this.pickHelper.clearPickPosition()
    )
    window.addEventListener(`mouseleave`, () =>
      this.pickHelper.clearPickPosition()
    )
    window.addEventListener(`mousemove`, e =>
      this.pickHelper.setPickPosition(e, this.app.renderer.domElement)
    )
  }
  renderScene () {
    requestAnimationFrame(() =>
      render(this.app, this.sceneData, this.pickHelper)
    )
  }

  updateVehicleMeshes (mbtaData) {
    const vehicleMeshIdMap = new Map()
    this.sceneData.vehicleMeshes.children.forEach(vm => {
      vehicleMeshIdMap.set(vm.userData.id, vm)
    })

    mbtaData.vehicles.forEach(v => {
      const correspondingMesh = vehicleMeshIdMap.get(v.id)
      if (correspondingMesh) {
        correspondingMesh.rotation.z = RenderUtils.calculateEulerRotation(
          v.bearing
        )
        correspondingMesh.position.copy(
          RenderUtils.calculateCoordinateProjection(
            v.latitude,
            v.longitude,
            this.sceneData.centroid
          )
        )
        correspondingMesh.userData = v
      } else {
        const mesh = RenderUtils.buildVehicleMesh(
          v,
          mbtaData.routes,
          this.sceneData.centroid
        )
        this.sceneData.vehicleMeshes.add(mesh)
      }
    })

    const toRemove = this.sceneData.vehicleMeshes.children.filter(vm => {
      !mbtaData.vehicles.has(vm.userData.id)
    })
    toRemove.forEach(vm => {
      this.sceneData.vehicleMeshes.remove(vm)
      if (vm.geometry) vm.geometry.dispose()
      if (vm.material) vm.material.dispose()
    })
  }
}

function getApp () {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(`rgb(37, 35, 48)`)
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.05,
    100
  )
  camera.position.set(0, 0, 3)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  const threeJsWindow = document.getElementById(`threeJsWindow`)
  threeJsWindow.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.update()

  return { renderer, scene, camera }
}

function getSceneData (mbtaData) {
  const centroid = RenderUtils.calculateCentroid(mbtaData.stops)
  const stopMeshes = RenderUtils.buildStopMeshGroup(mbtaData.stops, centroid)
  const vehicleMeshes = RenderUtils.buildVehicleMeshGroup(
    mbtaData.vehicles,
    mbtaData.routes,
    centroid
  )
  const tripShapeLines = RenderUtils.buildTripShapeLineGroup(
    mbtaData.tripShapes,
    centroid
  )
  return { centroid, stopMeshes, vehicleMeshes, tripShapeLines }
}

function render (app, sceneData, pickHelper) {
  pickHelper.pick(sceneData, app)
  app.renderer.render(app.scene, app.camera)
  requestAnimationFrame(() => render(app, sceneData, pickHelper))
}

function calculateCentroid (stops) {
  let sumLongitude = 0
  let sumLatitude = 0
  let count = 0
  stops.forEach(s => {
    sumLongitude += s.longitude
    sumLatitude += s.latitude
    count++
  })

  return {
    latitude: sumLatitude / count,
    longitude: sumLongitude / count
  }
}
