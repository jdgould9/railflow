import requests
import json
import time

with open("./railflow_web/static_mbta_info/routes/routes.json") as file:
    file_contents = file.read()
    # if this doesnt exist, then run download_routes.py and try again
routes = json.loads(file_contents)

def download_stops(route):
    request = requests.get(f"https://api-v3.mbta.com/stops?filter[route]={route}")
    json_str = json.dumps(request.json())
    with open(f"./railflow_web/static_mbta_info/stops/{route}.json", 'w+') as f:
        f.write(json_str)
        print(f"Downloaded stops of route {route} to ./railflow_web/static_mbta_info/stops/{route}.json")

for route in routes["data"]:
    print(route["id"])
    download_stops(route["id"])
    time.sleep(4) #20 requests per min, +1 sec for safety

#todo:
#add authent. w mbta api to make more requests, track requests