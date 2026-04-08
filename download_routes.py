import requests
import json

r = requests.get('https://api-v3.mbta.com/routes')
json_str = json.dumps(r.json())
with open('./railflow_web/static_mbta_info/routes/routes.json', 'w') as f:
    f.write(json_str)
    print("Downloaded routes to ./railflow_web/static_mbta_info/routes/routes.json")

# add failure handling