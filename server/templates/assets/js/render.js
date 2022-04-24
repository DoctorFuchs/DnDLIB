function getJson(url, method, callback) {
    var req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open(method, url, true);
    req.onload  = function() {
       var jsonResponse = req.response;
       callback(jsonResponse);
    };
    req.send(null);
}

class APIResponse extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});

        var stylesheet = document.createElement("link");
        stylesheet.href = "/assets/css/api_content.css";
        stylesheet.rel = "stylesheet";

        this.shadowRoot.appendChild(stylesheet);

        this.createEnviroment(() => {
            this.render();
        })
    }

    createEnviroment(callback) {
        getJson("/assets/json/render.json", "GET", resp => {
            this.models = resp;
            getJson(window.location.href, "POST", resp => {
                this.json = resp;
                callback();
            })
        })
    }

    capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    makeReadable(string) {
        return this.capitalize(string).replaceAll(/_/g, " ")
    }

    getModelFromName(name) {
        if (name == "classes") { name = "_classes"}
        return this.getModel(`#/models/${name}`)
    }

    getModel(path){
        if (!path.startsWith("#")) { return this.getModel("#/commons/default") }
        var path_list = path.trim().slice(1).split("/");
        var model = this.models;
        path_list.forEach(p => {
            if (p in model) { model = model[p]; }
        });
        if ("$ref" in model) {
            model = this.mergeDeep(this.getModel(model["$ref"]), model);
        }
        if (path != "#/commons/default") {
            model = this.mergeDeep(this.getModel("#/commons/default"), model);
        }
        return model;
    }

    generateHeading(key, value) {
        var model = this.getModelFromName(key)["headings"];

        if (!model.visible) { return null; }

        var elem = document.createElement(model.tag);
        elem.classList = model.classes;
        var content = model["content"].replaceAll("$key", key).replaceAll("$value", value);
        elem.innerText = this.makeReadable(content);

        return elem;
    }

    generateApiReference(value) {
        var elem = document.createElement("div");
        elem.classList.add("api-reference");
        elem.addEventListener("click", e => { window.location.assign(value.url) })
        elem.innerHTML = this.makeReadable(value.name);
        return elem;
    }

    getValue(value) {
        if (Array.isArray(value)) {
            var result = Array();
            value.forEach(item => {
                result = result.concat(this.getValue(item));
            });
            return result;
        }
        else if (!this.isObject(value)) {
            var elem = document.createElement("div");
            elem.innerHTML = value;
            return Array.of(elem);
        }
        else if ("url" in value && "name" in value && "index" in value) {
            return Array.of(this.generateApiReference(value));
        }
        return []
    }

    render() {
        var groups = {};
        Object.entries(this.json).forEach(entry => {
            const [key, value] = entry;
            const model = this.getModelFromName(key);

            if (!model.visible) { return; }

            var elem = document.createElement("section");
            elem.name = model.group;
            elem.id = key;

            // apply classes
            model.classes.forEach(cls => { elem.classList.add(cls) });
            elem.classList.add(model.group);
            elem.setAttribute("priority", model.priority)
            elem.style.order = model.priority;


            var heading = this.generateHeading(key, value);
            if (heading != null) { elem.appendChild(heading) }

            var content_elem = document.createElement("article");
            // TODO: value rendering for objects
            if (Array.isArray(value) && "name" in value.keys()) { value.sort((a, b) => {
                a.name.localeCompare(b.name)
            })}
            if (model.content) {
                this.getValue(value).forEach(item => { content_elem.appendChild(item); })
            }

            //if (content_elem.innerText == "") { return; }

            elem.appendChild(content_elem);

            if (model.single) {
                if (model.group in groups) {
                    if (groups[model.group][0].getAttribute("priority") > model.priority) {
                        return;
                    }
                }
                groups[model.group] = [content_elem];
            }
            else if (model.group in groups) {
                groups[model.group].push(elem);
            }
            else {
                groups[model.group] = [elem];
            }
        })

        var content = document.createElement("div");
        content.id = "content";

        Object.entries(groups).forEach(entry => {
            const [key, values] = entry;
            var group_element = document.createElement("div");
            group_element.id = `${key}-group`;
            values.forEach(element => {
                group_element.appendChild(element);
            })
            content.appendChild(group_element);
        })

        this.shadowRoot.appendChild(content);
    }

    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    mergeDeep(target, source) {
        let output = Object.assign({}, target);
        if (!this.isObject(target) && !this.isObject(source)) { return output; }

        Object.keys(source).forEach(key => {
            if (this.isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                }
                else {
                    output[key] = this.mergeDeep(target[key], source[key]);
                }
            }
            else if (Array.isArray(source[key])) {
                Object.assign(output, { [key]: source[key].concat(target[key]) });
            }
            else {
                Object.assign(output, { [key]: source[key] });
            }
        });
        return output;
    }
}

customElements.define('api-response', APIResponse);
