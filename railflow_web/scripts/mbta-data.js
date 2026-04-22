import timestamp from 'time-stamp'
import * as MbtaModels from './mbta-data-models'

export class MbtaData {
  constructor () {
    this.lines = new Map()
    this.routes = new Map()
    this.routeIds = []
    this.tripShapes = new Map()
    this.stops = new Map()
    this.vehicles = new Map()
    this.alerts = new Map()
    this.lastUpdatedTime = null
  }
  async init () {
    const staticData = await getStaticData()
    this.lines = staticData.lines
    this.routes = staticData.routes
    this.routeIds = Array.from(this.routes).map(r => r[0])
    this.tripShapes = staticData.tripShapes
    this.stops = staticData.stops
    const dynamicData = await getDynamicData(this.routeIds)
    this.vehicles = dynamicData.vehicles
    this.alerts = dynamicData.alerts
    this.lastUpdatedTime = timestamp(`YYYY-MM-DDTHH:mm:ss-04:00`)
  }
  async updateVehicles () {
    this.lastUpdatedTime = timestamp(`YYYY-MM-DDTHH:mm:ss-04:00`)
    const newVehicles = await getVehicleData(this.routeIds)

    newVehicles.forEach((nv, id) => {
      this.vehicles.set(id, nv)
    })

    for (const id of this.vehicles.keys()) {
      if (!newVehicles.has(id)) {
        this.vehicles.delete(id)
      }
    }
  }
  async updateAlerts () {
    this.lastUpdatedTime = timestamp(`YYYY-MM-DDTHH:mm:ss-04:00`)

    const newAlerts = await getAlertData(this.routeIds)

    newAlerts.forEach((na, id) => {
      this.alerts.set(id, na)
    })

    for (const id of this.alerts.keys()) {
      if (!newAlerts.has(id)) {
        this.alerts.delete(id)
      }
    }
  }
}

async function getStaticData () {
  const modelUrl = `./static_mbta/model.json`
  const jsonResult = await fetchData(modelUrl)

  const lines = MbtaModels.Line.buildLines(jsonResult[`lines`])
  const routes = MbtaModels.Route.buildRoutes(jsonResult[`routes`])
  const tripShapes = MbtaModels.TripShape.buildTripShapes(jsonResult[`shapes`])
  const stops = MbtaModels.Stop.buildStops(jsonResult[`stops`])

  return {
    lines: lines,
    routes: routes,
    tripShapes: tripShapes,
    stops: stops
  }
}

async function getDynamicData (routeIds) {
  const vehicles = await getVehicleData(routeIds)
  const alerts = await getAlertData(routeIds)

  return {
    vehicles: vehicles,
    alerts: alerts
  }
}

async function getVehicleData () {
  let vehiclesUrl = `http://localhost:5000/api/vehicles`
  const jsonResult = await fetchData(vehiclesUrl)
  const vehicles = MbtaModels.Vehicle.buildVehicles(jsonResult.data)
  return vehicles
}

async function getAlertData (routeIds) {
  let alertsUrl = `http://localhost:5000/api/alerts`
  const jsonResult = await fetchData(alertsUrl)
  const alerts = MbtaModels.Alert.buildAlerts(jsonResult.data)
  return alerts
}

async function fetchData (url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(error.message)
  }
}
