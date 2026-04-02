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
GRAPHING
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

class Graph {
  constructor () {
    this.nodes = new Set()
    this.edges = new Map()
  }
  addNode (node) {
    if (!this.nodes.has(node)) {
      this.nodes.add(node)
      this.edges.set(node, [])
    } else {
      console.error(`Node ${node} already exists in graph`)
    }
  }
  addEdge (node1, node2) {
    if (this.nodes.has(node1) && this.nodes.has(node2)) {
      this.edges.get(node1).push(node2)
      this.edges.get(node2).push(node1)
    } else {
      console.error(
        `Both ${node1} and ${node2} must exist in graph before adding an edge`
      )
    }
  }
  printGraph () {
    console.log(`${this.nodes.size} nodes total:`)
    this.nodes.forEach(node => console.log(node))

    console.log(`Isolated nodes:`)
    for (const node of this.nodes) {
      if (this.edges.get(node).length == 0) {
        console.log(node)
      }
    }

    console.log(`Edges:`)
    for (const node of this.nodes) {
      for (const connectedNode of this.edges.get(node)) {
        console.log(`${node.name} --- ${connectedNode.name}`)
      }
    }
  }
  static buildRandomGraph (numNodes, numEdges) {
    if (numEdges > (numNodes * (numNodes - 1)) / 2) {
      console.error(
        `${numEdges} edges is too many for a graph of ${numNodes} nodes.
        \nMaximum number of edges is n choose 2, or numNodes(numNodes - 1) / 2.`
      )
      return
    }

    const graph = new Graph()
    for (let i = 0; i < numNodes; i++) {
      graph.addNode(i)
    }

    let addedEdges = 0
    const nodesArray = Array.from(graph.nodes)
    while (addedEdges < numEdges) {
      const node1 = nodesArray[Math.floor(getRandom(0, numNodes))]
      const node2 = nodesArray[Math.floor(getRandom(0, numNodes))]

      if (node1 === node2) {
        continue
      } else if (graph.edges.get(node1).includes(node2)) {
        continue
      } else {
        graph.addEdge(node1, node2)
        addedEdges++
      }
    }
    return graph
  }
}

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
MBTA DATA
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

/*
INFO
*/
const infoText = document.querySelector(`#infoText`)
const lastUpdateTimeText = document.querySelector(`#lastUpdateTime`)
let stopCount = 0
const stopCountText = document.querySelector(`#stopCount`)
let vehicleCount = 0
const vehicleCountText = document.querySelector(`#vehicleCount`)

function updateSelectedInfo (node) {
  //   switch (node.userData.type) {
  //     case `stop`:
  //       infoText.textContent = `Longitude: ${node.userData.longitude},
  //           Latitude: ${node.userData.latitude},
  //           Name: ${node.userData.id},
  //           Type: Stop`
  //       break
  //     case `vehicle`:
  //       infoText.textContent = `Longitude: ${node.userData.longitude},
  //           Latitude: ${node.userData.latitude},
  //           Name: ${node.userData.id},
  //           Type: Vehicle`
  //       break
  //   }
}

/*
STOPS
*/
async function getMbtaStopInfo (routeFilter) {
  //   const url = `https://api-v3.mbta.com/stops?filter[route]=${routeFilter}`
  const url = `./local_mbta_info/stops/${routeFilter}.json`
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

function addStopsToGraph (jsonResult, stopGraph, route, nodeMap) {
  let previousStop = null

  jsonResult.data.forEach(stop => {
    let currentStop

    if (!nodeMap.has(stop.id)) {
      currentStop = {
        type: 'stop',
        id: stop.id,
        route: [route],
        longitude: stop.attributes.longitude,
        latitude: stop.attributes.latitude
      }

      stopGraph.addNode(currentStop)
      nodeMap.set(stop.id, currentStop)
    } else {
      currentStop = nodeMap.get(stop.id)
      // merge route if new
      if (!currentStop.route.includes(route)) {
        currentStop.route.push(route)
      }
    }

    // build edge
    if (previousStop && previousStop !== currentStop) {
      if (!stopGraph.edges.get(previousStop).includes(currentStop)) {
        stopGraph.addEdge(previousStop, currentStop)
      }
    }

    previousStop = currentStop
  })
}

async function buildStopGraph (routeFilters) {
  const stopGraph = new Graph()
  const nodeMap = new Map()

  for (const route of routeFilters) {
    const jsonResult = await getMbtaStopInfo(route)
    addStopsToGraph(jsonResult, stopGraph, route, nodeMap)
  }

  return stopGraph
}

/*
VEHICLES
*/
async function getMbtaVehicleInfo (routeFilter) {
  //   const url = `https://api-v3.mbta.com/vehicles?filter[route]=${routeFilter}`
  const url = `./local_mbta_info/vehicles/Red_Orange_Blue.json`
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
    vehicles.push({
      type: `vehicle`,
      id: vehicle.id,
      route: vehicle.relationships.route.data.id,
      longitude: vehicle.attributes.longitude,
      latitude: vehicle.attributes.latitude
    })
  })
}

async function buildVehicles (route) {
  const vehicles = []
  const jsonResult = await getMbtaVehicleInfo(route)
  buildVehicleObjects(jsonResult, vehicles)
  return vehicles
}

/*
MAIN
*/
async function initMbta (routeFilters) {
  const stopGraph = await buildStopGraph(routeFilters)
  const vehicles = await buildVehicles(routeFilters)
  console.log(`Vehicles:`)
  console.log(vehicles)
  console.log(`Stop graph:`)
  console.log(stopGraph)
  return {
    stopGraph: stopGraph,
    vehicles: vehicles
  }
}

const mbtaInfo = await initMbta([`Red`, `Orange`, `Blue`])

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
THREE.JS RENDERING
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

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
  scene.background = new THREE.Color('rgb(0, 0, 0)')
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.set(0, 0, 1)
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
function buildStopMesh (color) {
  const material = new THREE.MeshBasicMaterial({
    color: color
  })
  const geometry = new THREE.BoxGeometry(0.015, 0.015, 0.015)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x += Math.random() * Math.PI
  mesh.rotation.y += Math.random() * Math.PI
  mesh.rotation.z += Math.random() * Math.PI
  return mesh
}

function buildVehicleMesh (color) {
  const color1 = new THREE.Color(color)
  color1.addScalar(0.5)
  const material = new THREE.MeshBasicMaterial({ color: color1 })
  const geometry = new THREE.ConeGeometry(0.01, 0.015, 3)
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

function buildEdgeLine (color, position1, position2) {
  const material = new THREE.MeshBasicMaterial({
    color: color
  })
  const points = []
  points.push(new THREE.Vector3(position1.x, position1.y, 0))
  points.push(new THREE.Vector3(position2.x, position2.y, 0))
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geometry, material)
}

function calculateCentroid (graph) {
  let sumLongitude = 0
  let sumLatitude = 0
  let count = 0

  graph.nodes.forEach(node => {
    sumLongitude += node.longitude
    sumLatitude += node.latitude
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

function createGeospatialVisualization (mbtaInfo, scene) {
  const centroid = calculateCentroid(mbtaInfo.stopGraph)

  // stop nodes
  mbtaInfo.stopGraph.nodes.forEach(node => {
    const position = calculateProjectedCoordinates(
      node.longitude,
      node.latitude,
      centroid
    )
    let mesh
    if (node.route.length === 1) {
      mesh = buildStopMesh(node.route[0])
    } else {
      mesh = buildStopMesh(0xffffff)
    }
    // for now just use the first route for the color
    mesh.userData = node
    mesh.position.set(position.x, position.y, position.z)
    scene.add(mesh)

    // stop node edges
    mbtaInfo.stopGraph.edges.get(node).forEach(connectedNode => {
      const connectedNodePosition = calculateProjectedCoordinates(
        connectedNode.longitude,
        connectedNode.latitude,
        centroid
      )
      const line = buildEdgeLine(node.route, position, connectedNodePosition)
      scene.add(line)
    })
  })

  // vehicle nodes
  mbtaInfo.vehicles.forEach(vehicle => {
    const position = calculateProjectedCoordinates(
      vehicle.longitude,
      vehicle.latitude,
      centroid
    )
    const mesh = buildVehicleMesh(vehicle.route)
    mesh.userData = vehicle
    mesh.position.set(position.x, position.y, position.z)
    scene.add(mesh)
  })
}

/*
MAIN
*/
function main () {
  const app = initApp()
  window.addEventListener('mouseout', clearPickPosition)
  window.addEventListener('mouseleave', clearPickPosition)
  window.addEventListener('mousemove', e =>
    setPickPosition(e, app.renderer.domElement)
  )
  createGeospatialVisualization(mbtaInfo, app.scene)
  requestAnimationFrame(() => render(app.renderer, app.scene, app.camera))
}

main()
