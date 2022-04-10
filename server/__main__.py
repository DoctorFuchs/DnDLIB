from flask.templating import render_template
from flask import Flask, request, jsonify, send_from_directory
from jinja2.exceptions import TemplateNotFound
from server.utils.api import API
from server.utils.path import get_path
import os
import configparser
from markdown import markdown
import mimetypes

config = configparser.ConfigParser()
assert config.read("config.ini") != [], "CONFIG FILE WAS NOT READED"

mimetypes.add_type("text/javascript", ".js")

app = Flask(__name__)
api = API("https://www.dnd5eapi.co/api/")

app.jinja_env.globals.update(markdown=markdown)

@app.errorhandler(AssertionError)
def assertion_handler(error):
    return jsonify({
        "message": error.message,
        "code": 400
    }), 400

@app.route("/api/", defaults={"request_path":"", "base_node":""}, methods=["GET", "POST"])
@app.route("/api/<string:base_node>", defaults={"request_path":""}, methods=["GET", "POST"])
@app.route("/api/<string:base_node>/<path:request_path>", methods=["GET", "POST"])
def api_serve(base_node:str, request_path:str):
    request_path = request_path.strip()

    if request.method == "GET":
        resp = api.get_raw(base_node+"/"+request_path)
        template = ""

        if resp.status_code != 200:
            template = "error.html"

        elif request_path == "":
            template = "/api/list.html"

        else:
            template = f"/api/render.html"

        return render_template(template, **{
            "request_path":request_path,
            "base_node": base_node,
            "api_resp":resp.json(),
            "api": api,
            "site": config,
            "error_code": resp.status_code
        }), resp.status_code

    else:
        return api.get(base_node+request_path)

@app.route("/assets/<string:folder>/<path:path>")
def asset_serve(folder, path):
    return send_from_directory(get_path("/server/templates/assets/"+folder), path, mimetype=mimetypes.guess_type(path)[0])

@app.route("/", defaults={"request_path":"index.html"})
@app.route("/<path:request_path>")
def frontend_serve(request_path):
    try:
        return render_template(request_path, **{
                "site":config,
                "api":api,
                "request_path":request_path
            }), 200

    except TemplateNotFound:
        return render_template("error.html", **{
                "site":config,
                "api":api,
                "error_code":404
            }), 404

if __name__ == "__main__":
    app.run(config.get("SERVER", "hostname"), config.getint("SERVER", "port"), debug=True)
