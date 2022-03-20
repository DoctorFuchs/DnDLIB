import requests

class API:
    def __init__(self, api_url) -> None:
        self.api_url = api_url
        self.cache = {}

    def get(self, path):
        if path in self.cache: return self.cache[path].json()
        return requests.get(self.api_url+path).json()
    
    def get_raw(self, path):
        resp = requests.get(self.api_url+path)
        self.cache[path] = resp 
        return resp