import requests
from .config import config


class API:
    def __init__(self, api_url) -> None:
        self.api_url = api_url
        self.cache = {}

        # cache main and level 1 subsites, around 15 sites
        if not config.get("SERVER", "debug"):
            print("catching api main and level 1 subsites...")
            for key, url in self.get("").items():
                self.get(url)

    @staticmethod
    def cut(path):
        if path.startswith("/api/"):
            return path.replace("/api/", "", 1)
        return path

    def get(self, path):
        return self.get_raw(path).json()

    def get_raw(self, path):
        path = self.cut(path)
        if path in self.cache: return self.cache[path]
        resp = requests.get(self.api_url + path)
        self.cache[path] = resp
        return resp

    def search(self, query) -> list[dict]:
        search_urls = self.get("")
        results = []
        for key, url in search_urls.items():
            result = self.get(url).get("results", [])
            if not result: continue
            results.append({
                "text": key,
                "tag": "h2"
            })
            results = [*results, *result, {
                "name": key,
                "index": key,
                "url": url
            }]

        final_results = []
        for result in results:
            if "text" in result or "tag" in result:
                final_results.append(result)
                continue

            for x in result.values():
                if query.lower() in x.lower():
                    final_results.append(result)
                    break;

        title = False
        indexes = []
        for result in range(len(final_results)):
            if "text" in final_results[result] or "tag" in final_results[result]:
                if title:
                    indexes.append(result - 1)
                title = True

            else:
                title = False

        popped = 0
        for index in indexes:
            final_results.pop(index - popped)
            popped += 1

        if "text" in final_results[-1] or "tag" in final_results[-1]:
            final_results.pop(-1)

        return final_results
