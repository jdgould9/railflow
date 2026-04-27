'''
build_static_mbta.py
-
constructs static mbta info into .json format to serve on railflow web
run periodically to keep static info up to date
'''
# TODO: Add type hints
# TODO: Add error handling  
# Including but not limited to:
# Bad API response
# Missing keys for json objects (currently assumes certain keys will always exist)

import requests
from requests.auth import HTTPBasicAuth
import json
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
MBTA_API_KEY = os.getenv('MBTA_API_KEY')

def fetch(url, payload=None):
    auth = HTTPBasicAuth('apikey', MBTA_API_KEY)
    if payload:
        response = requests.get(url, params=payload, auth=auth)
    else:
        response = requests.get(url)
    return response.json()

def save(jsonDict, filename) -> None:
    with open(f'../railflow_web/static_mbta/{filename}.json', 'w') as file:
        json.dump(jsonDict, file)
        print('Successful build')
        print(f'Saved to ../railflow_web/static_mbta/{filename}.json')

def get_lines(line_ids):
    line_params = {
        'filter[id]': ','.join(line_ids),
    }
    lines = fetch('https://api-v3.mbta.com/lines', line_params)
    return lines['data']

def get_routes_and_patterns(route_include):
    route_params = {
        'include':','.join(route_include),
    }
    routes = fetch('https://api-v3.mbta.com/routes', route_params)
    return {
        'routes': routes['data'],
        'route_patterns': routes['included']
    }

def get_trips_and_shapes(trip_include, route_pattern_ids):
    trip_params = {
        'include':','.join(trip_include),
        'filter[route_pattern]': ','.join(route_pattern_ids)
    }
    trips_and_shapes = fetch('https://api-v3.mbta.com/trips', trip_params)
    return{
        'trips':trips_and_shapes['data'],
        'shapes':trips_and_shapes['included']
    }

def get_stops(route_ids):
    stop_params = {
        'filter[route]': ','.join(route_ids)
    }
    stops = fetch('https://api-v3.mbta.com/stops', stop_params)
    return stops['data']

def build_model():
    # RETRIEVAL & FILTERING
    # retrieve lines
    line_ids = ['line-Red', 'line-Mattapan', 'line-Orange', 'line-Green', 'line-Blue']
    lines = get_lines(line_ids)

    # retrieve routes and route patterns
    route_include = ['route_patterns']
    routes_and_patterns = get_routes_and_patterns(route_include)
    routes_raw, route_patterns_raw = routes_and_patterns['routes'], routes_and_patterns['route_patterns']

    # reduce routes =>
    routes = [r for r in routes_raw if r['relationships']['line']['data']['id'] in line_ids]

    # reduce route_patterns =>
    route_ids = [r['id'] for r in routes]
    route_patterns = [rp for rp in route_patterns_raw if rp['relationships']['route']['data']['id'] in route_ids]

    # retrieve trips and shapes
    trip_include = ['shape']
    route_pattern_ids = [rp['id'] for rp in route_patterns]
    trips_and_shapes = get_trips_and_shapes(trip_include, route_pattern_ids)
    trips_raw, shapes_raw = trips_and_shapes['trips'], trips_and_shapes['shapes']

    # reduce trips => 
    representative_trip_ids = [rp['relationships']['representative_trip']['data']['id'] for rp in route_patterns]
    trips = [t for t in trips_raw if t['id'] in representative_trip_ids]

    # reduce shapes => shapes corresponding to representative trips
    representative_shape_ids = [t['relationships']['shape']['data']['id'] for t in trips]
    shapes = [s for s in shapes_raw if s['id'] in representative_shape_ids]

    # adding a reference to corresponding route for each shape
    shapes_by_id = {s['id']: s for s in shapes}
    for t in trips:
        trip_route_id = t['relationships']['route']['data']['id']
        corresponding_shape_id = t['relationships']['shape']['data']['id']
        corresponding_shape = shapes_by_id[corresponding_shape_id]
        corresponding_shape['route'] = trip_route_id

    # adding a reference to corresponding route color each shape
    routes_by_id = {r['id']: r for r in routes}
    for s in shapes:
        corresponding_route = routes_by_id[s['route']]
        corresponding_route_color = corresponding_route['attributes']['color']
        s['color'] = corresponding_route_color

    # retrieve stops
    stops = get_stops(route_ids)
    
    # create model
    build_time = str(datetime.now())
    model = {
        'lines':lines,
        'routes':routes,
        'shapes':shapes,
        'stops':stops,
        'build_time':build_time
    }
    save(model, 'model')

build_model()


