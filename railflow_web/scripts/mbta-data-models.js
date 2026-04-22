import polyUtil from 'polyline-encoded'

/*
Static MBTA classes
*/
export class Line {
  constructor (id, longName, color) {
    this.id = id
    this.longName = longName
    this.color = color
    this.type = `line`
  }
  static buildLines (jsonResult) {
    const lines = new Map()
    jsonResult.forEach(l => {
      lines.set(
        l.id,
        new Line(l.id, l.attributes.long_name, l.attributes.color)
      )
    })
    return lines
  }
}

export class Route {
  constructor (id, longName, color, description, parentLineId) {
    this.id = id
    this.longName = longName
    this.color = color
    this.description = description
    this.parentLineId = parentLineId
    this.type = `route`
  }
  static buildRoutes (jsonResult) {
    const routes = new Map()
    jsonResult.forEach(r => {
      routes.set(
        r.id,
        new Route(
          r.id,
          r.attributes.long_name,
          r.attributes.color,
          r.attributes.description,
          r.relationships.line.data.id
        )
      )
    })
    return routes
  }
}

export class TripShape {
  constructor (id, decodedPolyline, parentRouteId, color) {
    this.id = id
    this.decodedPolyline = decodedPolyline // [[lat, long] ...]
    this.parentRouteId = parentRouteId
    this.parentRouteId = parentRouteId
    this.color = color
    this.type = `tripshape`
  }
  static buildTripShapes (jsonResult) {
    const tripShapes = new Map()
    jsonResult.forEach(ts => {
      const encoded = ts.attributes.polyline
      const decoded = polyUtil.decode(encoded, 5)
      tripShapes.set(ts.id, new TripShape(ts.id, decoded, ts.route, ts.color))
    })
    return tripShapes
  }
}

export class Stop {
  constructor (id, name, address, latitude, longitude) {
    this.id = id
    this.name = name
    this.address = address
    this.latitude = latitude
    this.longitude = longitude
    this.type = `stop`
  }
  static buildStops (jsonResult) {
    const stops = new Map()
    jsonResult.forEach(s => {
      stops.set(
        s.id,
        new Stop(
          s.id,
          s.attributes.name,
          s.attributes.address,
          s.attributes.latitude,
          s.attributes.longitude
        )
      )
    })
    return stops
  }
}

/*
Dynamic MBTA classes
*/
export class Alert {
  constructor (
    id,
    cause,
    effect,
    severity,
    serviceEffect,
    header,
    description,
    createdAt,
    activePeriod,
    url // often null
  ) {
    this.id = id
    this.cause = cause
    this.effect = effect
    this.severity = severity
    this.serviceEffect = serviceEffect
    this.header = header
    this.description = description
    this.createdAt = createdAt
    this.activePeriod = activePeriod
    this.url = url
    this.type = `alert`
  }
  static buildAlerts (jsonResult) {
    const alerts = new Map()
    jsonResult.forEach(a => {
      alerts.set(
        a.id,
        new Alert(
          a.id,
          a.attributes.cause,
          a.attributes.effect,
          a.attributes.severity,
          a.attributes.service_effect,
          a.attributes.header,
          a.attributes.description,
          a.attributes.created_at,
          a.attributes.active_period,
          a.attributes.url
        )
      )
    })
    return alerts
  }
}

export class Vehicle {
  constructor (id, route, latitude, longitude, bearing, updatedAt) {
    this.id = id
    this.route = route
    this.latitude = latitude
    this.longitude = longitude
    this.bearing = bearing
    this.updatedAt = updatedAt
    this.type = `vehicle`
  }
  static buildVehicles (jsonResult) {
    const vehicles = new Map()
    jsonResult.forEach(v => {
      vehicles.set(
        v.id,
        new Vehicle(
          v.id,
          v.relationships.route.data.id,
          v.attributes.latitude,
          v.attributes.longitude,
          v.attributes.bearing,
          v.attributes.updated_at
        )
      )
    })
    return vehicles
  }
}
