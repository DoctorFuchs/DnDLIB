class SearchBar extends HTMLElement {
    constructor() {
        super();

        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get("query");

        // Attaches a shadow root to your custom element.
        const shadowRoot = this.attachShadow({mode: 'open'});

        // Defines the "real" input element.
        let inputElement = document.createElement('input');
        inputElement.setAttribute('type', this.getAttribute('type'));
        inputElement.id = "searchbar-input";
        inputElement.style.width = "100%";
        inputElement.placeholder = "Search...";
        inputElement.value = query;

        if (!this.isGlobalSearch()) {
            inputElement.onkeyup =  e => {
                let article = this.parentNode.getElementsByTagName("article")[0];
                let targets = article.getElementsByTagName("div");
                let filter = inputElement.value.toUpperCase();
                for (let i = 0; i < targets.length; i++) {
                    let txtValue = targets[i].textContent || targets[i].innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        targets[i].style.display = "";
                    } else {
                        targets[i].style.display = "none";
                    }
                }
                Array.from(article.getElementsByTagName("h3")).forEach(e => {
                    e.style.display = "";
                })
                let was_heading = [false, 0];
                for (let i = 0; i < article.children.length; i++) {
                    let target = article.children[i];
                    let visible = target.style.display !== "none";
                    let is_heading = target.tagName.startswith("H");
                    if (is_heading && was_heading[0] || i === article.children.length-1 && was_heading[0]) {
                        article.children[was_heading[1]].style.display = "none";
                    }
                    if (visible) {
                        was_heading = [is_heading, i];
                    }
                }
            }
        }
        else {
            inputElement.onkeydown = e => {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    window.location = `${window.location.origin}/search?query=${inputElement.value}`
                }
            }
        }
        // Appends the input into the shadow root.
        shadowRoot.appendChild(inputElement);
    }

    isGlobalSearch() {
        return ["/search", "/"].includes(window.location.pathname);
    }
}

customElements.define('search-bar', SearchBar);
