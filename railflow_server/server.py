'''
server.py
-
retrieves dynamic mbta info
serves dynamic mbta info
periodically runs build_static_mbta.py to update model
'''
# TODO: Add error handling
# TODO: Vehicle & alert fetching should be streams?
# TODO: Add cron job to update model
# TODO: Add route ids to env?

from flask import Flask, jsonify
from flask_apscheduler import APScheduler
from flask_cors import CORS
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os

load_dotenv()
MBTA_API_KEY = os.getenv('MBTA_API_KEY')

app = Flask(__name__)

class Config:
    SCHEDULER_API_ENABLED = True
app.config.from_object(Config())

CORS(app, origins='http://localhost:5173')

scheduler = APScheduler()
scheduler.init_app(app)

def fetch(url, payload=None):
    auth = HTTPBasicAuth('apikey', MBTA_API_KEY)
    if payload:
        response = requests.get(url, params=payload, auth=auth)
    else:
        response = requests.get(url, auth=auth)
    return response.json()

def fetch_vehicles():
    route_ids = ['Red', 'Mattapan', 'Orange', 'Blue', 'Green-B', 'Green-C', 'Green-D', 'Green-E']
    vehicle_params = {
        'filter[route]': ','.join(route_ids),
    }
    vehicles = fetch('https://api-v3.mbta.com/vehicles', vehicle_params)
    return vehicles

def fetch_alerts():
    route_ids = ['Red', 'Mattapan', 'Orange', 'Blue', 'Green-B', 'Green-C', 'Green-D', 'Green-E']
    route_params = {
        'filter[route]': ','.join(route_ids)
    }
    routes = fetch('https://api-v3.mbta.com/alerts', route_params)
    return routes

latest_vehicles = fetch_vehicles()
@scheduler.task('interval', id='update_vehicles', seconds=4, misfire_grace_time=60)
def update_vehicles():
    global latest_vehicles
    latest_vehicles = fetch_vehicles()

latest_alerts = fetch_alerts()
@scheduler.task('interval', id='update_alerts', seconds=180, misfire_grace_time=60)
def update_alerts():
    global latest_alerts
    latest_alerts = fetch_alerts()

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    return jsonify(latest_vehicles)

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    return jsonify(latest_alerts)

@scheduler.task('cron', id='update_model', hour=0)
def update_model():
    # create updated model
    # update model.json that's part of railflow_web's resources
    # this won't work for deployment but this works for concept
    pass

scheduler.start()

if __name__ == '__main__':
    app.run(port=5000, debug=False)
