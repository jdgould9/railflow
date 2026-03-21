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
  switch (node.userData.type) {
    case `stop`:
      infoText.textContent = `Longitude: ${node.userData.longitude},
          Latitude: ${node.userData.latitude},
          Name: ${node.userData.name},
          Type: Stop`
      break

    case `vehicle`:
      infoText.textContent = `Longitude: ${node.userData.longitude},
          Latitude: ${node.userData.latitude},
          Name: ${node.userData.name},
          Type: Vehicle`

      break
  }
}

/*
STOPS
*/
async function getMbtaStopInfo (route) {
  // const url = `https://api-v3.mbta.com/stops?filter[route]=${routeFilter}`
  const url = `./local_mbta_info/stops/${route}.json`
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

// buildEdgesBetweenStops: not ideal
// stops array in api json result happen to preseve route stop order
// not sure if this is intentional, doesn't *feel* ideal? (might be a nothingburger)
// api might have some way of indicating stop connection? this works for now
// also to fix: stops on different routes connecting to each other (see 200 Washington St. stop both on blue and orange route)
// see: /routes 'direction_destination'? and 'direction_names'?
function buildNodesFromStops (jsonResult, graph) {
  jsonResult.data.forEach(stop => {
    graph.addNode({
      type: `stop`,
      longitude: stop.attributes.longitude,
      latitude: stop.attributes.latitude
    })
    stopCount++
  })
}

function buildEdgesBetweenStops (graph) {
  const stops = Array.from(graph.nodes)
  for (let i = 0; i < stops.length - 1; i++) {
    graph.addEdge(stops[i], stops[i + 1])
  }
}

async function buildStopGraph (route) {
  const stopGraph = new Graph()
  const jsonResult = await getMbtaStopInfo(route)
  buildNodesFromStops(jsonResult, stopGraph)
  buildEdgesBetweenStops(stopGraph)
  return stopGraph
}

/*
VEHICLES
*/
async function getMbtaVehicleInfo (route) {
  // const url = `https://api-v3.mbta.com/vehicles?filter[route]=${routeFilter}`
  const url = `./local_mbta_info/vehicles/${route}.json`
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

function buildNodesFromVehicles (jsonResult, graph) {
  jsonResult.data.forEach(vehicle => {
    graph.addNode({
      type: `vehicle`,
      longitude: vehicle.attributes.longitude,
      latitude: vehicle.attributes.latitude
    })
    lastUpdateTimeText.textContent = `Last update: ${vehicle.attributes.updated_at}`
    vehicleCount++
  })
}

async function buildVehicleGraph (route) {
  const vehicleGraph = new Graph()
  const jsonResult = await getMbtaVehicleInfo(route)
  buildNodesFromVehicles(jsonResult, vehicleGraph)
  return vehicleGraph
}

/*
MAIN
*/
async function initMbta (routeFilters) {
  const mbtaGraphs = {
    stopGraphs: [],
    vehicleGraphs: []
  }
  for (const route of routeFilters) {
    const stopGraph = await buildStopGraph(route)
    const vehicleGraph = await buildVehicleGraph(route)
    mbtaGraphs.stopGraphs.push(stopGraph)
    mbtaGraphs.vehicleGraphs.push(vehicleGraph)
  }
  return mbtaGraphs
}

const mbtaGraphs = await initMbta([
  `Red`,
  `Orange`,
  `Blue`,
  `Green-B`,
  `Green-C`,
  `Green-D`,
  `Green-E`
])

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
  const geometry = new THREE.SphereGeometry(0.01)
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

function buildVehicleMesh (color) {
  const material = new THREE.MeshBasicMaterial({ color: color })
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

function calculateCentroid (graphs) {
  let sumLongitude = 0
  let sumLatitude = 0
  let count = 0

  graphs.forEach(graph => {
    graph.nodes.forEach(node => {
      sumLongitude += node.longitude
      sumLatitude += node.latitude
      count++
    })
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

function createGeospatialVisualization (mbtaGraphs, scene) {
  const centroid = calculateCentroid(mbtaGraphs.stopGraphs)
  const stopColor = 0x5555ff
  const vehicleColor = 0xff1111
  for (const stopGraph of mbtaGraphs.stopGraphs) {
    stopGraph.nodes.forEach(node => {
      const position = calculateProjectedCoordinates(
        node.longitude,
        node.latitude,
        centroid
      )
      const mesh = buildStopMesh(stopColor)
      mesh.userData = node
      mesh.position.set(position.x, position.y, position.z)
      scene.add(mesh)

      stopGraph.edges.get(node).forEach(connectedNode => {
        const connectedNodePosition = calculateProjectedCoordinates(
          connectedNode.longitude,
          connectedNode.latitude,
          centroid
        )
        const line = buildEdgeLine(stopColor, position, connectedNodePosition)
        scene.add(line)
      })
    })
  }
  for (const vehicleGraph of mbtaGraphs.vehicleGraphs) {
    vehicleGraph.nodes.forEach(node => {
      const position = calculateProjectedCoordinates(
        node.longitude,
        node.latitude,
        centroid
      )
      const mesh = buildVehicleMesh(vehicleColor)
      mesh.userData = node
      mesh.position.set(position.x, position.y, position.z)
      scene.add(mesh)
    })
  }
}

function createRandomizedVisualization (mbtaGraphs, scene) {}

function createForceDirectedVisualization (mbtaGraphs, scene) {}

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
  createGeospatialVisualization(mbtaGraphs, app.scene)
  requestAnimationFrame(() => render(app.renderer, app.scene, app.camera))
}

main()
