/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
UTILITY
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

/*
FUNCTION getRandom
Returns a random float between 'min' and 'max', inclusive
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
        console.log(`${node} --- ${connectedNode}`)
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

async function getMbtaLineStops (routeFilter) {
  // const url = `https://api-v3.mbta.com/stops?filter[route]=${routeFilter}`
  const url = `./local_mbta_info/${routeFilter}.json`
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
      id: stop.id,
      name: stop.attributes.name,
      longitude: stop.attributes.longitude,
      latitude: stop.attributes.latitude
    })
  })
  return graph
}

function buildEdgesFromStops (jsonResult) {}

let jsonResult = await getMbtaLineStops(`redline_stops`)
const redLineGraph = buildNodesFromStops(jsonResult)

jsonResult = await getMbtaLineStops(`orangeline_stops`)
const orangeLineGraph = buildNodesFromStops(jsonResult)

jsonResult = await getMbtaLineStops(`blueline_stops`)
const blueLineGraph = buildNodesFromStops(jsonResult)

jsonResult = await getMbtaLineStops(`greenbline_stops`)
const greenBLineGraph = buildNodesFromStops(jsonResult)

jsonResult = await getMbtaLineStops(`greencline_stops`)
const greenCLineGraph = buildNodesFromStops(jsonResult)

jsonResult = await getMbtaLineStops(`greendline_stops`)
const greenDLineGraph = buildNodesFromStops(jsonResult)

jsonResult = await getMbtaLineStops(`greeneline_stops`)
const greenELineGraph = buildNodesFromStops(jsonResult)

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
THREE.JS RENDERING
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

function setupApp () {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('rgb(194, 194, 194)')
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 5)
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.update()
  return { renderer, scene, camera }
}

function buildSphereMesh (color) {
  const geometry = new THREE.RingGeometry(0.01, 0.02)
  const material = new THREE.MeshBasicMaterial({ color: color })
  return new THREE.Mesh(geometry, material)
}

function calculateCentroidOfGraphs (graphs) {
  let sum_longitude = 0
  let sum_latitude = 0
  let count = 0
  for (const graph of graphs) {
    for (const node of graph.nodes) {
      sum_longitude += node.longitude
      sum_latitude += node.latitude
      count += 1
    }
  }
  return {
    centroid_longitude: sum_longitude / count,
    centroid_latitude: sum_latitude / count
  }
}

function calculateFinalCoordinates (longitude, latitude, centroid) {
  let x = 10.0 * (longitude - centroid.centroid_longitude)
  let y = 10.0 * (latitude - centroid.centroid_latitude)

  return { x: x, y: y, z: 0 }
}

function addMbtaGraphToGroup (graph, nodeGroup, color, centroid) {
  graph.nodes.forEach(node => {
    const mesh = buildSphereMesh(color)
    const position = calculateFinalCoordinates(
      node.longitude,
      node.latitude,
      centroid
    )
    mesh.position.set(position.x, position.y, position.z)
    nodeGroup.add(mesh)
  })
}

function render (renderer, scene, camera) {
  renderer.render(scene, camera)
  requestAnimationFrame(() => render(renderer, scene, camera))
}

function main () {
  const app = setupApp()

  const centroid = calculateCentroidOfGraphs([
    redLineGraph,
    blueLineGraph,
    greenBLineGraph,
    greenCLineGraph,
    greenDLineGraph,
    greenELineGraph
  ])

  const nodeGroup = new THREE.Group()

  addMbtaGraphToGroup(redLineGraph, nodeGroup, 0xda291c, centroid)
  addMbtaGraphToGroup(orangeLineGraph, nodeGroup, 0xed8b00, centroid)
  addMbtaGraphToGroup(blueLineGraph, nodeGroup, 0x003da5, centroid)
  addMbtaGraphToGroup(greenBLineGraph, nodeGroup, 0x00843d, centroid)
  addMbtaGraphToGroup(greenCLineGraph, nodeGroup, 0x00843d, centroid)
  addMbtaGraphToGroup(greenDLineGraph, nodeGroup, 0x00843d, centroid)
  addMbtaGraphToGroup(greenELineGraph, nodeGroup, 0x00843d, centroid)

  app.scene.add(nodeGroup)

  requestAnimationFrame(() => render(app.renderer, app.scene, app.camera))
}
main()
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

// function positionNodesInSphereLayout(){
//     //3d version of positionNodesInCircularLayout
// }

// function positionNodesInCylindricalLayout(minRange, maxRange){
//     //lazy function, just initializes spheres to random layout,
//     //then repositions x and y coordinates to create a sphere
//     //minRange and maxRange determine negative z and positive z ranges
//     positionNodesInRandomLayout(minRange, maxRange);
//     positionNodesInCircularLayout();
// }

// function positionNodesIn2dGridLayout(width, depth){
//     //2d grid consists of rows, cols
//     //doesnt have to be, can be rectangle
//     //with 16 nodes:
//     //4 rows, 4 cols
//     //with 9 nodes:
//     //3 rows, 3 cols
//     //how to decide rows/cols w rectangle?
// }

// function positionNodesIn3dGridLayout(width, depth, height){
//     //3d grid consists of rows, cols, depth/slices
// }

// addNode(node) {
//     if (!this.nodes.includes(node)) {
//         this.nodes.push(node);
//         this.edges.set(node, []);
//     }
//     else {
//         console.error(`Duplicate node <id:${node.id} value:${node.value}> not added to graph`);
//     }
// }
// addEdge(node1, node2) {
//     if (!this.edges.get(node1).includes(node2) && !this.edges.get(node2).includes(node1)) {
//         this.edges.get(node1).push(node2);
//         this.edges.get(node2).push(node1);
//     }
//     else {
//         console.error(`Duplicate edge from <id:${node1.id} value:${node1.value}> to <id:${node2.id} value:${node2.value}>`)
//     }
// }
// printGraph() {
//     console.log("Connected nodes:");
//     for (const node of this.nodes) {
//         for (const connectedNode of this.edges.get(node)) {
//             console.log(`${node.id} --- ${connectedNode.id}`);
//         }
//     }
//     console.log("Isolated nodes:");
//     for (const node of this.nodes) {
//         if (this.edges.get(node).length === 0) {
//             console.log(`${node.id}`);
//         }
//     }
// }
// printGraphStats(){
//     console.log(`Number of nodes: ${this.nodes.length}`);
//     let numEdges = 0;
//     this.edges.forEach(element =>{
//         numEdges += element.length;
//     })
//     console.log(`Number of edges: ${numEdges / 2}`);
// }
// static createRandomGraph(numNodes, numEdges) {
//     // max numEdges = n choose 2, or numNodes(numNodes - 1)/2
//     if (numEdges > (numNodes * (numNodes - 1)) / 2) {
//         console.error(`${numEdges} edges is too many for a graph of ${numNodes} nodes.\n
//             Maximum number of edges is n choose 2, or numNodes(numNodes - 1) / 2.`)
//         return;
//     }
//     const graph = new Graph();
//     for (let i = 0; i < numNodes; i++) {
//         const node = new Node(i);
//         graph.addNode(node);
//     }

//     let addedEdges = 0;
//     while(addedEdges < numEdges){
//         const node1 = graph.nodes[Math.floor(getRandom(0, numNodes))];
//         const node2 = graph.nodes[Math.floor(getRandom(0, numNodes))];

//         if (node1 === node2) {
//             continue;
//         }
//         else if (graph.edges.get(node1).includes(node2)) {
//             continue;
//         }
//         else{
//             graph.addEdge(node1, node2);
//             addedEdges++;
//         }
//     }
//     return graph;
// }
