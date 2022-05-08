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

        var script = document.createElement("script");
        script.src = "/assets/js/search.js";
        this.shadowRoot.appendChild(script);
    }

    createEnviroment(callback) {
        getJson("/assets/json/render.json", "GET", resp => {
            this.models = resp;
            getJson(this.dataset.url||window.location.toString(), "POST", resp => {
                this.json = resp;
                callback();
            })
        })
    }

    capitalize(string) {
        return string.toString().charAt(0).toUpperCase() + string.slice(1);
    }

    makeReadable(string) {
        return this.capitalize(string).replaceAll(/[_-]/g, " ")
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

    generateAreaOfEffect(value) {
        var elem = document.createElement("div");
        elem.classList.add("area-of-effect");
        elem.innerHTML = `${value.size} ft (${value.type})`
        return elem;
    }

    generateAlignmentChoice(value) {
        var alignments = Array();
        value.alignments.forEach(alignment => {
            alignments.push(alignment.name)
        })

        if (alignments.length==9) {
            alignments = ["Any Alignment"];
        }

        var elem = document.createElement("p");
        elem.innerHTML = `${value.desc} (${alignments.join(", ")})`
        return elem;
    }

    generateEquipment(value) {
        value.equipment.name = value.quantity + " " + value.equipment.name
        return this.getValue("equipment", value.equipment)
    }

    generateEquipmentChoice(value) {
        var getOption = (value, selected=false) => {
            var option = document.createElement("option");
            option.innerHTML = value;
            option.value = value;
            option.selected = selected;
            option.disabled = !selected;
            return option;
        }
        var choicer = document.createElement("select");
        choicer.appendChild(getOption(`Select ${value.choose} of`, true));

        Object.values(value.from).forEach(value => {
            var getEquipmentDescription = (_value) => {
                if ("equipment_category" in _value) {
                    return _value.equipment_category.name;
                }
                else if ("equipment" in _value) {
                    return _value.quantity + " " + _value.equipment.name;
                }
                else if ("equipment_option" in _value) {
                    return  _value.equipment_option.choose + " " +
                            getEquipmentDescription(_value.equipment_option.from);
                }
                else if (Array.isArray(_value) || this.isObject(_value)) {
                    if (this.isObject(_value)) {
                        _value = Object.values(_value);
                    }
                    var result = [];
                    _value.forEach(item => {
                        result.push(getEquipmentDescription(item));
                    })
                    return result.join(" and ");
                }
            }
            choicer.appendChild(getOption(getEquipmentDescription(value)));

        })

        return choicer;
    }

    generateFeature(value) {
        var elem = document.createElement("div");
        elem.innerHTML += `<h3>${value.name}</h3>`;
        elem.innerHTML += Array.isArray(value.desc)? value.desc.join("<br><br>"): value.desc;
        return elem;
    }

    generateCost(value) {
        var elem = document.createElement("div");
        elem.innerHTML = `${value.quantity} ${this.makeReadable(value.unit)}`;
        return elem;
    }

    generateDefaultChoice(value) {
        var getOption = (value, selected=false) => {
            var option = document.createElement("option");
            option.innerHTML = value;
            option.value = value;
            option.selected = selected;
            option.disabled = !selected;
            return option;
        }
        var choicer = document.createElement("select");
        choicer.appendChild(getOption(`Select ${value.choose} of`, true));

        Object.values(value.from).forEach(value => {
            choicer.appendChild(getOption(value.name));
        })

        return choicer;
    }

    generateAttackChoice(value) {
        var elem = document.createElement("div");
        elem.innerHTML += `<p>Choose ${value.choose}: </p>`;

        var list = document.createElement("ul");
        var addToList = (content) => {
            var item = document.createElement("li");
            item.innerHTML = content;
            list.appendChild(item);
        }

        var generate = (attack) => {
            list.innerHTML += `<li>Attack ${attack.count} times with ${attack.name} (${attack.type})</li>`
        }

        value.from.forEach(_value => {
            if (this.isObject(_value)) {
                Object.values(_value).forEach(attack => {
                    generate(attack);
                });
            }
            else {
                generate(_value);
            }
        })
        elem.appendChild(list)
        return elem;
    }

    generateItem(value) {
        value.item.name = value.quantity + " " + value.item.name;
        return this.generateApiReference(value.item);
    }

    generatePreAbility(value) {
        value.ability_score.name = ">" + value.minimum_score + " " + value.ability_score.name;
        return this.generateApiReference(value.ability_score);
    }

    generateAbilityBonus(value) {
        value.ability_score.name = "+" + value.bonus + " " + value.ability_score.name;
        return this.generateApiReference(value.ability_score);
    }

    generateProfiency(value) {
        value.proficiency.name = "+" + value.value + " " + value.proficiency.name;
        return this.generateApiReference(value.proficiency);
    }

    getUsage(usage) {
        switch (usage.type) {
            case "per day":
                return `(${usage.times}/day)`

            case "recharge on roll":
                return `(Roll a ${usage.dice}, if it is greater than ${usage.min_value} recharge the action)`
            default:

        }
        return "";
    }

    generateAttack(value) {
        var elem = document.createElement("div");
        elem.innerHTML += value.usage?`<h3>${value.name} ${this.getUsage(value.usage)}</h3>`:`<h3>${value.name}</h3>`;
        elem.innerHTML += `<p>${value.desc}</p>`;
        return elem;
    }

    generateMulticlassing(value) {
        var elem = document.createElement("div");
        var add_header = (text) => {
            var header = document.createElement("h3");
            header.innerText = text;
            elem.appendChild(header)
        }

        if (value.prerequisites) {
            add_header("Prerequisites: ");

            Array.from(value.prerequisites).forEach(pre => {
                elem.appendChild(this.generatePreAbility(pre));
            })

            elem.innerHTML += "<br>";
        }
        if (value.proficiencies) {
            add_header("Proficiencies: ");

            Array.from(value.proficiencies).forEach(pro => {
                elem.appendChild(this.generateApiReference(pro));
            })
            elem.innerHTML += "<br>";
        }
        if (value.proficiency_choices) {
            add_header("Proficiency Choices: ");

            Array.from(value.proficiency_choices).forEach(choice => {
                elem.appendChild(this.generateChoice(choice))
            })
            elem.innerHTML += "<br>";
        }
        return elem

    }

    generateChoice(value) {
        var elem = document.createElement("div");
        elem.classList.add("choice");

        //elem.innerHTML = `Choose ${value.choose} ${value.type}`
        if (value.type == null) {
            value.type = "attack";
        }

        switch (value.type) {
            case "bonds":
            case "ideals":
            case "personality_traits":
            case "flaws": {
                var table = document.createElement("table");
                var tbody = document.createElement("tbody");
                var thead = document.createElement("thead");

                var row = document.createElement("tr");
                var col1 = document.createElement("th");
                var col2 = document.createElement("th");

                col1.innerText = `d${value.from.length}`;
                col2.innerHTML = this.makeReadable(value.type);
                row.appendChild(col1);
                row.appendChild(col2);

                thead.appendChild(row);

                Object.entries(value.from).forEach(choose => {
                    var [_key, _value] = choose;

                    var row = document.createElement("tr");
                    var col1 = document.createElement("td");
                    var col2 = document.createElement("td");

                    col1.innerText = _key - "-1";
                    this.getValue(_key, _value).forEach(item => { col2.appendChild(item) })

                    row.appendChild(col1);
                    row.appendChild(col2);

                    tbody.appendChild(row);
                });
                table.appendChild(thead);
                table.appendChild(tbody);
                elem.appendChild(table)
                return elem;
            }
            case "equipment": {
                return this.generateEquipmentChoice(value);
            }
            case "attack": {
                return this.generateAttackChoice(value);
            }
            default: {
                console.log(value)
                return this.generateDefaultChoice(value);
            }

        }
    }

    getValue(key, value) {
        if (Array.isArray(value) && value.length != 0) {
            var result = Array();
            switch (typeof value[0]) {
                case "string": {
                    var elem = document.createElement("div");
                    elem.innerHTML = value.join(", ");
                    result = Array.of(elem);
                    break;
                }
                case "object": {
                    value.forEach(item => {
                        result = result.concat(this.getValue(key, item));
                    });
                    break;
                }
            }
            return result;
        }
        else if (this.isObject(value)) {
            switch (Object.keys(value).toString()) {
                case "index,name,url": {
                    return Array.of(this.generateApiReference(value));
                }
                case "size,type": {
                    return Array.of(this.generateAreaOfEffect(value));
                }
                case "choose,from,type": {
                    return Array.of(this.generateChoice(value));
                }
                case "alignments,desc": {
                    return Array.of(this.generateAlignmentChoice(value))
                }
                case "equipment,quantity": {
                    return this.generateEquipment(value)
                }
                case "desc,name": {
                    return Array.of(this.generateFeature(value));
                }
                case "quantity,unit": {
                    return Array.of(this.generateCost(value))
                }
                case "item,quantity": {
                    return Array.of(this.generateItem(value))
                }
                case "ability_score,minimum_score": {
                    return Array.of(this.generatePreAbility(value))
                }
                case "ability_score,bonus": {
                    return Array.of(this.generateAbilityBonus(value));
                }
                case "proficiency,value": {
                    return Array.of(this.generateProfiency(value))
                }
                case "desc,name,options": {
                    var result = [this.generateFeature(value)];
                    result.push(this.generateChoice(value.options));
                    return result;
                }
            }
            switch (key) {
                case "senses":
                case "speed": {
                    var result = [];
                    Object.entries(value).forEach(entry => {
                        const [_key, _value] = entry;
                        result.push(`${this.makeReadable(_key)}: ${_value}`);
                    })
                    var elem = document.createElement("div");
                    elem.innerHTML = result.join("<br>");
                    return Array.of(elem)
                }
                case "multi_classing": {
                    return Array.of(this.generateMulticlassing(value));
                }
                case "legendary_actions":
                case "special_abilities":
                case "actions": {
                    return Array.of(this.generateAttack(value))
                }
                default: {
                    console.log(key, value)
                }
            }
        }
        else if (typeof value == "string") {
            if (value.startsWith("/api/")) {
                var elem = document.createElement("api-response");
                elem.dataset.url = value;
                return Array.of(elem);
            }
        }
        var elem = document.createElement("div");
        elem.innerHTML = value;
        elem.innerText = this.makeReadable(elem.innerText);
        return Array.of(elem);
    }

    render() {
        var groups = {};
        if (Array.isArray(this.json)) {
            var table = document.createElement("table");
            var header = document.createElement("thead");
            var column = (head="", header=false) => {
                var temp = document.createElement(header?"th":"td");
                temp.innerText = head;
                return temp;
            }

            header.appendChild(column("Level", true));
            header.appendChild(column("Proficiency Bonus", true));
            header.appendChild(column("Features", true));

            if (this.json[0].class_specific) {
                Object.keys(this.json[0].class_specific).forEach(item => {
                    header.appendChild(column(this.makeReadable(item), true))
                });
            }

            table.appendChild(header);

            this.json.forEach((item, i) => {
                var body = document.createElement("tbody");
                body.appendChild(column(item.level));
                body.appendChild(column("+"+item.prof_bonus))

                var features = column();
                this.getValue(item.features).forEach(item => {
                    features.appendChild(item);
                })
                body.appendChild(features)

                if (item.class_specific) {
                    Object.values(item.class_specific).forEach(item => {
                        body.appendChild(column(item))
                    });
                }
                table.appendChild(body);
            });
            this.shadowRoot.innerHTML = "<h1>LEVELLLLLS</h1>";
            this.shadowRoot.appendChild(table);
            return;
        }

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
            if (model.content) {
                if (key == "results") {
                    elem.appendChild(document.createElement("search-bar"))
                    if (window.location.pathname == "/api/features") {
                        value.sort((a, b) => {
                            a.name = this.makeReadable(a.index);
                            b.name = this.makeReadable(b.index);
                            a.name.localeCompare(b.name);
                        })
                    }
                }
                this.getValue(key, value).forEach(item => {
                    try {
                        content_elem.appendChild(item)
                    } catch (TypeError) {
                        console.log(item);
                    }
                })
            }

            if (model.group == "default") { console.log("default:", key, value) }

            if (content_elem.innerText == "") { return; }

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
