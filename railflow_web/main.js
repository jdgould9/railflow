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
        `${numEdges} edges is too many for a graph of ${numNodes} nodes.\nMaximum number of edges is n choose 2, or numNodes(numNodes - 1) / 2.`
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

const infoText = document.querySelector(`#infoText`)
const lastUpdateTimeText = document.querySelector(`#lastUpdateTime`)
let stopCount = 0
const stopCountText = document.querySelector(`#stopCount`)
let vehicleCount = 0
const vehicleCountText = document.querySelector(`#vehicleCount`)

async function getMbtaLineStops (routeFilter) {
  // const url = `https://api-v3.mbta.com/stops?filter[route]=${routeFilter}`
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

function buildNodesFromStops (jsonResult) {
  const graph = new Graph()
  jsonResult.data.forEach(stop => {
    graph.addNode({
      type: `stop`,
      longitude: stop.attributes.longitude,
      latitude: stop.attributes.latitude,
      name: stop.attributes.name
    })
    stopCount++
  })
  return graph
}

// buildEdgesBetweenStops: not ideal
// stops array in api json result happen to preseve route stop order
// not sure if this is intentional, doesn't *feel* ideal? (might be a nothingburger)
// api might have some way of indicating stop connection? this works for now
// also to fix: stops on different routes connecting to each other (see 200 Washington St. stop both on blue and orange route)
// see: /routes 'direction_destination'? and 'direction_names'?
function buildEdgesBetweenStops (graph) {
  const stops = Array.from(graph.nodes)
  for (let i = 0; i < stops.length - 1; i++) {
    graph.addEdge(stops[i], stops[i + 1])
  }
}

async function getMbtaLineVehicles (routeFilter) {
  // const url = `https://api-v3.mbta.com/vehicles?filter[route]=${routeFilter}`
  const url = `./local_mbta_info/vehicles/${routeFilter}.json`
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

function buildNodesFromVehicles (jsonResult) {
  const graph = new Graph()
  jsonResult.data.forEach(vehicle => {
    graph.addNode({
      type: `vehicle`,
      longitude: vehicle.attributes.longitude,
      latitude: vehicle.attributes.latitude,
      name: vehicle.id,
      updated_at: vehicle.attributes.updated_at
    })
    lastUpdateTimeText.textContent = `Last update: ${vehicle.attributes.updated_at}`
    vehicleCount++
  })
  return graph
}

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

let jsonResult

jsonResult = await getMbtaLineStops(`Red`)
const redLineGraph = buildNodesFromStops(jsonResult)
buildEdgesBetweenStops(redLineGraph)

jsonResult = await getMbtaLineVehicles(`Red`)
const redVehiclesGraph = buildNodesFromVehicles(jsonResult)

jsonResult = await getMbtaLineStops(`Orange`)
const orangeLineGraph = buildNodesFromStops(jsonResult)
buildEdgesBetweenStops(orangeLineGraph)

jsonResult = await getMbtaLineVehicles(`Orange`)
const orangeVehiclesGraph = buildNodesFromVehicles(jsonResult)

jsonResult = await getMbtaLineStops(`Blue`)
const blueLineGraph = buildNodesFromStops(jsonResult)
buildEdgesBetweenStops(blueLineGraph)

jsonResult = await getMbtaLineVehicles(`Blue`)
const blueVehiclesGraph = buildNodesFromVehicles(jsonResult)

jsonResult = await getMbtaLineStops(`Green-B`)
const greenBLineGraph = buildNodesFromStops(jsonResult)
buildEdgesBetweenStops(greenBLineGraph)

jsonResult = await getMbtaLineVehicles(`Green-B`)
const greenBVehiclesGraph = buildNodesFromVehicles(jsonResult)

jsonResult = await getMbtaLineStops(`Green-C`)
const greenCLineGraph = buildNodesFromStops(jsonResult)
buildEdgesBetweenStops(greenCLineGraph)

jsonResult = await getMbtaLineVehicles(`Green-C`)
const greenCVehiclesGraph = buildNodesFromVehicles(jsonResult)

stopCountText.textContent = `${stopCount} stops`
vehicleCountText.textContent = `${vehicleCount} vehicles`

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
THREE.JS RENDERING
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

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

function initializeApp () {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('rgb(0, 0, 0)')
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.set(0, 0, 3)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.update()
  return { renderer, scene, camera }
}

function buildStopMesh (color) {
  const material = new THREE.MeshBasicMaterial({
    color: color
  })
  const geometry = new THREE.SphereGeometry(0.01)
  return new THREE.Mesh(geometry, material)
}

function buildVehicleMesh (color) {
  const INNER_RADIUS = 0.0
  const OUTER_RADIUS = 0.01
  const THETA_SEGMENTS = 3
  const material = new THREE.MeshBasicMaterial({ color: color })
  const geometry = new THREE.RingGeometry(
    INNER_RADIUS,
    OUTER_RADIUS,
    THETA_SEGMENTS
  )
  return new THREE.Mesh(geometry, material)
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

function calculateCentroidOfGraphs (graphs) {
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

function calculateFinalCoordinates (longitude, latitude, centroid) {
  const MAP_SCALE = 10.0
  let x = MAP_SCALE * (longitude - centroid.centroidLongitude)
  let y = MAP_SCALE * (latitude - centroid.centroidLatitude)
  let z = 0

  return { x: x, y: y, z: z }
}

function drawStopGraph (graph, scene, color, centroid) {
  graph.nodes.forEach(node => {
    const position = calculateFinalCoordinates(
      node.longitude,
      node.latitude,
      centroid
    )
    const mesh = buildStopMesh(color)
    mesh.userData = node
    mesh.position.set(position.x, position.y, position.z)
    scene.add(mesh)

    graph.edges.get(node).forEach(connectedNode => {
      const connectedNodePosition = calculateFinalCoordinates(
        connectedNode.longitude,
        connectedNode.latitude,
        centroid
      )
      const line = buildEdgeLine(color, position, connectedNodePosition)
      scene.add(line)
    })
  })
}

function drawVehicleGraph (graph, scene, color, centroid) {
  graph.nodes.forEach(node => {
    const position = calculateFinalCoordinates(
      node.longitude,
      node.latitude,
      centroid
    )
    const mesh = buildVehicleMesh(color)
    mesh.userData = node
    mesh.position.set(position.x, position.y, position.z)
    scene.add(mesh)
  })
}

function render (renderer, scene, camera) {
  renderer.render(scene, camera)
  pickHelper.pick(pickPosition, scene, camera)
  requestAnimationFrame(() => render(renderer, scene, camera))
}

function main () {
  const app = initializeApp()

  window.addEventListener('mousemove', e =>
    setPickPosition(e, app.renderer.domElement)
  )
  window.addEventListener('mouseout', clearPickPosition)
  window.addEventListener('mouseleave', clearPickPosition)

  const centroid = calculateCentroidOfGraphs([
    redLineGraph,
    orangeLineGraph,
    blueLineGraph,
    greenBLineGraph,
    greenCLineGraph
  ])

  drawStopGraph(redLineGraph, app.scene, 0xda291c, centroid)
  drawVehicleGraph(redVehiclesGraph, app.scene, 0xda291c, centroid)

  drawStopGraph(orangeLineGraph, app.scene, 0xed8b00, centroid)
  drawVehicleGraph(orangeVehiclesGraph, app.scene, 0xed8b00, centroid)

  drawStopGraph(blueLineGraph, app.scene, 0x003da5, centroid)
  drawVehicleGraph(blueVehiclesGraph, app.scene, 0x003da5, centroid)

  drawStopGraph(greenBLineGraph, app.scene, `rgb(0, 255, 60)`, centroid)
  drawVehicleGraph(greenBVehiclesGraph, app.scene, `rgb(0, 255, 60)`, centroid)

  drawStopGraph(greenCLineGraph, app.scene, `rgb(70, 132, 50)`, centroid)
  drawVehicleGraph(greenCVehiclesGraph, app.scene, `rgb(70, 132, 50)`, centroid)

  requestAnimationFrame(() => render(app.renderer, app.scene, app.camera))
}
main()
