class Builder {
    constructor(instance, tag) {
        this.instance = instance;
        this.result = document.createElement(tag);
    }

    addElement(tag) {
        return new Builder(this, tag);
    }

    call(callback) {
        callback(this.result);
        return this;
    }

    build(attach=false) {
        if (this.instance.class === Builder) {
            this.instance.result.appendChild(this.result);
            return this.instance;
        }
        else {
            if (attach && this.instance.shadowRoot) {
                this.instance.shadowRoot.appendChild(this.result)
            }
            return this.result;
        }
    }

    setInnerHTML(content) {
        this.result.innerHTML = content;
        return this;
    }

    setInnerText(content) {
        this.result.innerText = content;
        return this;
    }

    addInnerHTML(content) {
        this.result.innerHTML += content;
        return this;
    }

    addInnerText(content) {
        this.result.innerText += content;
        return this;
    }

    clear() {
        this.result = document.createElement(this.result.tagName);
        return this;
    }

    addClass(class_name) {
        this.result.className += class_name;
        return this;
    }

    removeClass(class_name) {
        // TODO: Remove class function
    }

    toggleClass(class_name) {
        // TODO: toggle class function
    }

    appendChild(elem) {
        this.result.appendChild(elem);
        return this;
    }
}

class Base extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
    }

    addScript(url) {
        let script = document.createElement("script");
        script.src = url;
        this.shadowRoot.appendChild(script);
        return script;
    }

    addStyle(url) {
        let stylesheet = document.createElement("link");
        stylesheet.href = url;
        stylesheet.rel = "stylesheet";
        this.shadowRoot.appendChild(stylesheet);
        return stylesheet;
    }

    addIcon(icon_name, ...classes) {
        let icon = document.createElement("i");
        icon.className = `fa fa-${icon_name} ${classes.join(" ")}`;
        this.shadowRoot.appendChild(icon);
        return icon;
    }

    addText(content, size="12px", tag="p") {
        let text = document.createElement(tag);
        text.innerText = content;
        text.style.fontsize = size;
        this.shadowRoot.appendChild(text);
        return text;
    }

    getJson(url, method, callback) {
        let req = new XMLHttpRequest();
        req.responseType = "json";
        req.open(method, url, true);
        req.onload  = function() {
            let jsonResponse = req.response;
            return callback(jsonResponse);
        };
        req.send(null);
    }

    capitalize(string) {
        return string.toString().charAt(0).toUpperCase() + string.slice(1);
    }

    makeReadable(string) {
        return this.capitalize(string).replaceAll(/[_-]/g, " ")
    }

    isObject(item) {
        return (item && typeof item === "object" && !Array.isArray(item));
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

    markdown(text) {
        if (!text) { return "" }
        text = marked.parse(text);
        return text;
    }

    builder(tag) {
        return new Builder(this, tag)
    }
}

class APIResponse extends Base {
    constructor() {
        super();

        this.addStyle("/assets/css/font-awesome.min.css");

        this.addIcon("cog", "fa-spin", "fa-3x", "fa-fw", "icon-center");
        this.addText("Loading...", "25px", "p", "text-center");

        this.createEnvironment(() => {
            this.shadowRoot.innerHTML = ""
            this.addStyle("/assets/css/api_content.css");
            this.addStyle("/assets/css/font-awesome.min.css");
            this.render();
        })

        this.addScript("/assets/js/search.js");
        this.addScript("/assets/js/marked.js");
    }

    createEnvironment(callback) {
        this.getJson("/assets/json/render.json", "GET", resp => {
            this.models = resp;
            this.url = this.dataset.url||window.location.toString();
            this.getJson(this.url, "POST", resp => {
                this.json = resp;
                callback();
            })
        })
    }

    getModelFromName(name) {
        if (name === "classes") { name = "_classes"}
        return this.getModel(`#/models/${name}`)
    }

    getModel(path){
        if (!path.startsWith("#")) { return this.getModel("#/commons/default") }
        let path_list = path.trim().slice(1).split("/");
        let model = this.models;
        path_list.forEach(p => {
            if (p in model) { model = model[p]; }
        });
        if ("$ref" in model) {
            model = this.mergeDeep(this.getModel(model["$ref"]), model);
        }
        if (path !== "#/commons/default") {
            model = this.mergeDeep(this.getModel("#/commons/default"), model);
        }
        return model;
    }

    generateHeading(key, value) {
        let model = this.getModelFromName(key)["headings"];

        if (!model.visible) { return null; }

        return this.builder(model.tag).call(elem => {
            model.classes.forEach(cls => {
                elem.addClass(cls);
            })
        }).setInnerHTML(
            this.makeReadable(
                model.content.replaceAll("$key", key).replaceAll("$value", value)
            )
        ).build()
    }

    generateApiReference(value) {
        return this.builder("div").addClass("api-reference").call(elem => {
            elem.addEventListener("click", e => { window.location.assign(value.url) })
        }).setInnerText(this.makeReadable(value.name)).build()
    }

    generateAreaOfEffect(value) {
        return this.builder("div")
            .addClass("area-of-effect")
            .setInnerText(`${value.size} ft (${value.type})`)
            .build();
    }

    generateAlignmentChoice(value) {
        let alignments = Array();
        value.alignments.forEach(alignment => {
            alignments.push(alignment.name)
        })

        if (alignments.length === 9) {
            alignments = ["Any Alignment"];
        }

        return this.builder("p")
            .setInnerHTML(`${value.desc} (${alignments.join(", ")})`)
            .build()
    }

    generateEquipment(value) {
        value.equipment.name = value.quantity + " " + value.equipment.name
        return this.getValue("equipment", value.equipment)
    }

    getOption(value, selected=false) {
        return this.builder("option").setInnerHTML(value).call(option => {
            option.innerHTML = value;
            option.value = value;
            option.selected = selected;
            option.disabled = !selected;
        }).build();
    }

    generateEquipmentChoice(value) {
        let getEquipmentDescription = (val) => {
            if ("equipment_category" in val) {
                return val.equipment_category.name;
            }
            else if ("equipment" in val) {
                return val.quantity + " " + val.equipment.name;
            }
            else if ("equipment_option" in val) {
                return val.equipment_option.choose + " " +
                    getEquipmentDescription(val.equipment_option.from);
            }
            else if (Array.isArray(val) || this.isObject(val)) {
                if (this.isObject(val)) {
                    val = Object.values(val);
                }
                let result = [];
                val.forEach(item => {
                    result.push(getEquipmentDescription(item));
                })
                return result.join(" and ");
            }
        }

        return this.generateSelectChoice(value, getEquipmentDescription)
    }

    generateFeature(value) {
        return this.builder("div").addInnerHTML(`<h3>${value.name}</h3>`).addInnerHTML(
            Array.isArray(value.desc)? value.desc.join("<br><br>"): value.desc
        ).build()
    }

    generateCost(value) {
        return this.builder("div").setInnerHTML(`${value.quantity} ${this.makeReadable(value.unit)}`).build();
    }

    generateSelectChoice(value, wrapper= (val) => {return val} ) {
        return this.builder("select").appendChild(
            this.getOption(`Select ${value.choose} of`, true)
        ).call(choicer => {
            Object.values(value.from).forEach(value => {
                choicer.appendChild(this.getOption(wrapper(value)));
            })
        }).build()
    }

    generateAttackChoice(value) {
        return this.builder("div").addInnerHTML(`<p>Choose ${value.choose}: </p>`)
            .addElement('ul').call(list => {
                value.from.forEach(_value => {
                    if (!this.isObject(_value)) { _value = {1: _value} }
                    Object.values(_value).forEach(attack => {
                        list.innerHTML += `<li>Attack ${attack.count} times with ${attack.name} (${attack.type})</li>`;
                    });
                })
            }).build().build()
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

    generateProficiency(value) {
        value.proficiency.name = "+" + value.value + " " + value.proficiency.name;
        return this.generateApiReference(value.proficiency);
    }

    getUsage(usage) {
        switch (usage.type) {
            case "per day":
                return `(${usage.times}/day)`

            case "recharge on roll":
                return `(Roll a ${usage.dice}, if it is greater than ${usage.min_value} recharge the action)`
        }
        return "";
    }

    generateAttack(value) {
        return this.builder("div")
            .addInnerHTML(value.usage?`<h3>${value.name} ${this.getUsage(value.usage)}</h3>`:`<h3>${value.name}</h3>`)
            .addInnerHTML(`<p>${value.desc}</p>`).build()
    }

    generateMulticlassing(value) {
        return this.builder("div").call(elem => {
            let add_header = (text) => {
                elem.appendChild(this.builder("h3").setInnerText(text).build());
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
        }).build()
    }

    generateChoice(value) {
        return this.builder("div").addClass("choice").call(elem => {
            if (!value.type) { value.type = "attack"; }

            switch (value.type) {
                case "bonds":
                case "ideals":
                case "personality_traits":
                case "flaws": {
                    return this.builder("table")
                        .addElement("thead").addElement("tr").setInnerHTML(
                            `<th>d${value.from.length}</th>
                             <th>${this.makeReadable(value.type)}</th>`
                        )
                        .build()
                        .build()
                        .addElement("tbody").call(tbody => {
                            Object.entries(value.from).forEach(choose => {
                                let [_key, _value] = choose;

                                tbody.appendChild(
                                    this.builder("tr")
                                        .addElement("td")
                                            .setInnerText(Number(_key)+1)
                                        .build()
                                        .addElement("td")
                                            .call(td => {
                                                this.getValue(_key, _value).forEach(item => { td.appendChild(item) })
                                            })
                                        .build()
                                        .build()
                                );
                            });
                        }).build();
                }
                case "equipment": {
                    return this.generateEquipmentChoice(value);
                }
                case "attack": {
                    return this.generateAttackChoice(value);
                }
                default: {
                    return this.generateSelectChoice(value);
                }

            }
        })
    }

    getMainHeader() {
        var row = this.builder("div");
        if (this.url.indexOf("/api/") !== -1) {
            var results = [];
            var urls = this.url.split("/api/").slice(-1)[0].split("/");
            urls.forEach((item, i) => {
                results.push(`<a class="path-link" href="/api/${urls.slice(0, i+1).join("/")}">${this.makeReadable(item)}</a>`)
            })
            row.addElement("span").addClass("path-bar").setInnerHTML(results.join(" > ")).build();
            row.addElement("span").addClass("utils-bar").build();
            // add utils for users here, like printer icon with print onclick
        }

        return row.build()
    }

    getValue(key, value) {
        if (Array.isArray(value) && value.length != 0) {
            var result = Array();
            switch (key) {
                case "class_levels": {
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

                    if (value[0].class_specific) {
                        Object.keys(value[0].class_specific).forEach(item => {
                            header.appendChild(column(this.makeReadable(item), true))
                        });
                    }

                    table.appendChild(header);

                    value.forEach((item, i) => {
                        var body = document.createElement("tbody");
                        body.appendChild(column(item.level));
                        body.appendChild(column("+"+item.prof_bonus))

                        var features = column();
                        this.getValue("", item.features).forEach(item => {
                            features.appendChild(item);
                        })
                        body.appendChild(features)

                        if (item.class_specific) {
                            Object.values(item.class_specific).forEach(item => {
                                body.appendChild(column(item))
                            });
                        }
                        table.appendChild(body);
                    })
                    return [table]
                }
            }
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
                case "tag,text": {
                    var elem = document.createElement(value.tag);
                    elem.innerText = this.makeReadable(value.text);
                    return Array.of(elem)
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
                    return Array.of(this.generateProficiency(value))
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
                case "spellcasting": {
                    var elem = document.createElement("div");
                    var create_info = (info) => {
                        var header = document.createElement("h3");
                        var text = document.createElement("p");

                        header.innerText = info.name;
                        text.innerHTML = info.desc.join("<br>")

                        return [header, text];
                    }
                    elem.innerHTML = `<p>Since level ${value.level} your spellcasting ability is ${value.spellcasting_ability.name}.</p>`;
                    value.info.forEach(item => {
                        create_info(item).forEach(e =>{
                            elem.appendChild(e)
                        });
                    })

                    return Array.of(elem)
                }

                case "spells": {
                    return this.getValue("results", value.results);
                }
                default: {
                    console.log(key, value)
                }
            }
        }
        var elem = document.createElement("div");
        elem.innerHTML = value;
        elem.innerText = this.makeReadable(elem.innerText);
        return Array.of(elem);
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
            if (model.content) {
                if (key === "results" || model.searchbar) {
                    elem.appendChild(document.createElement("search-bar"))
                    if (window.location.pathname === "/api/features") {
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

            if (model.group === "default") { console.log("default:", key, value) }

            if (content_elem.innerText === "" && !model.accept_empty) { return; }

            if (model.markdown) { content_elem.innerHTML = this.markdown(Array.isArray(value)?value.join("<br><br>"):value) }

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

        this.shadowRoot.appendChild(this.getMainHeader());
        this.shadowRoot.appendChild(content);
    }
}

customElements.define('api-response', APIResponse);
