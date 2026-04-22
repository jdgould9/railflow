import * as THREE from 'three'

export function buildStopMeshGroup (stops, centroid) {
  const stopMeshes = new THREE.Group()
  stops.forEach(s => {
    const sm = buildStopMesh(s, centroid)
    stopMeshes.add(sm)
  })
  return stopMeshes
}

function buildStopMesh (stop, centroid) {
  const geometry = new THREE.SphereGeometry(0.02, 8, 4)
  const material = new THREE.MeshBasicMaterial()
  const mesh = new THREE.Mesh(geometry, material)

  mesh.position.copy(
    calculateCoordinateProjection(stop.latitude, stop.longitude, centroid)
  )

  mesh.userData = stop
  return mesh
}

export function buildTripShapeLineGroup (tripShapes, centroid) {
  const tripShapeLines = new THREE.Group()
  tripShapes.forEach(ts => {
    const tsl = buildTripShapeLine(ts, centroid)
    tripShapeLines.add(tsl)
  })
  return tripShapeLines
}

function buildTripShapeLine (tripShape, centroid) {
  const points = []
  tripShape.decodedPolyline.forEach(coordinatePair => {
    points.push(
      calculateCoordinateProjection(
        coordinatePair[0],
        coordinatePair[1],
        centroid
      )
    )
  })

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const color = new THREE.Color(`#${tripShape.color}`)
  const material = new THREE.LineBasicMaterial({ color: color })
  const line = new THREE.Line(geometry, material)

  line.userData = tripShape
  return line
}

export function buildVehicleMeshGroup (vehicles, routes, centroid) {
  const vehicleMeshes = new THREE.Group()
  vehicles.forEach(v => {
    const vm = buildVehicleMesh(v, routes, centroid)
    vehicleMeshes.add(vm)
  })
  return vehicleMeshes
}

export function buildVehicleMesh (vehicle, routes, centroid) {
  const geometry = new THREE.ConeGeometry(0.03, 0.07, 3)
  const color = new THREE.Color(`#${routes.get(vehicle.route).color}`)
  color.addScalar(0.1)
  const material = new THREE.MeshBasicMaterial({ color: color })
  const mesh = new THREE.Mesh(geometry, material)

  mesh.rotation.z = calculateEulerRotation(vehicle.bearing)
  mesh.position.copy(
    calculateCoordinateProjection(vehicle.latitude, vehicle.longitude, centroid)
  )

  mesh.userData = vehicle
  return mesh
}

export function calculateEulerRotation (bearing) {
  return -1.0 * THREE.MathUtils.degToRad(bearing)
}

export function calculateCoordinateProjection (latitude, longitude, centroid) {
  const MAP_SCALE = 25.0
  const x = MAP_SCALE * (longitude - centroid.longitude)
  const y = MAP_SCALE * (latitude - centroid.latitude)
  const projectedCoordinates = new THREE.Vector3(x, y, 0)
  return projectedCoordinates
}

export function calculateCentroid (stops) {
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
