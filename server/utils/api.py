import requests

class API:
    def __init__(self, api_url) -> None:
        self.api_url = api_url
        self.cache = {}

        # cache main and level 1 subsites, around 15 sites
        print("catching api main and level 1 subsites...")
        for key, url in self.get("").items(): self.get(url)

    def cut(self, path):
        if path.startswith("/api/"):
            return path.replace("/api/", "", 1)
        return path

    def get(self, path):
        return self.get_raw(path).json()

    def get_raw(self, path):
        path = self.cut(path)
        if path in self.cache: return self.cache[path]
        resp = requests.get(self.api_url+path)
        self.cache[path] = resp
        return resp

    def search(self, query) -> list[dict]:
        search_urls = self.get("")
        results = []
        for key, url in search_urls.items():
            results = [*results, *self.get(url).get("results", [])]
            results.append({
                "name":key,
                "index":key,
                "url":url
            })

        final_results = []
        for result in results:
            if \
              query.lower() in result["name"].lower() or \
              query.lower() in result["index"].lower() or \
              query.lower() in result["url"].lower():

                final_results.append(result)

        return final_results
