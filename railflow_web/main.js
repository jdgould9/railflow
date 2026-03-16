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

async function getMbtaRedLineStops () {
  const url = `https://api-v3.mbta.com/stops?filter[route]=Red`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const jsonResult = await response.json()
    console.log(jsonResult)
    return jsonResult
  } catch (error) {
    console.error(error.message)
  }
}

function buildGraphFromStops (jsonResult) {
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

const jsonResult = await getMbtaRedLineStops()
const mbtaGraph = buildGraphFromStops(jsonResult)

/*
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
THREE.JS RENDERING
----------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------
*/

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

let scene, camera, renderer
function setupApp () {
  scene = new THREE.Scene()
  scene.background = new THREE.Color('rgb(54, 54, 54)')

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  )
  camera.position.set(0, 0, 20)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    antialias: true
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.update()

  return { renderer, scene, camera }
}

function addMbtaGraphToScene (graph, scene) {
  let x = 0
  graph.nodes.forEach(node => {
    const geometry = new THREE.SphereGeometry(0.05)
    const material = new THREE.MeshBasicMaterial({ color: 0xda291c })
    const mesh = new THREE.Mesh(geometry, material)
    const x = (node.longitude - parseInt(node.longitude)) * 20
    const y = (node.latitude - parseInt(node.latitude)) * 20
    mesh.position.set(x, y, 0)
    scene.add(mesh)
  })
}

function render (renderer, scene, camera) {
  renderer.render(scene, camera)
  requestAnimationFrame(() => render(renderer, scene, camera))
}

const app = setupApp()
const randomGraph = Graph.buildRandomGraph(10, 10)
addMbtaGraphToScene(mbtaGraph, app.scene)

requestAnimationFrame(() => render(app.renderer, app.scene, app.camera))

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

// // TODO:
// // 1) API Connectivity
// // 1a) Stops as graph nodes
// // 2) Graph layouts
// // 2a) Force-directed graph layout
// // 3) Implemented various unimplemented misc functions (lol)

// // ISSUES:
// // 1) drawEdges() draws duplicate line for each edge:
// // currently draws node1->node2 AND node2->node1
// // should only draw node1->node2 OR node2->node1
// // 2) createRandomGraph leads to infinite loop ;

// // FEATURES?:
// // 1) live rendering of nodes being ADDED to graph?
// // see: https://x.com/zzznah/status/2026436980884529594
