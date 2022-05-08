class SearchBar extends HTMLElement {
    constructor() {
        super();

        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get("query");
        const isGlobalSearch = window.location.pathname.indexOf(["/search", "/"])

        // Attaches a shadow root to your custom element.
        const shadowRoot = this.attachShadow({mode: 'open'});

        // Defines the "real" input element.
        let inputElement = document.createElement('input');
        inputElement.setAttribute('type', this.getAttribute('type'));
        inputElement.id = "searchbar-input";
        inputElement.style.width = "100%";
        inputElement.placeholder = "Search...";
        inputElement.value = query;

        if (!isGlobalSearch) {
            inputElement.onkeyup =  e => {
                var targets = this.getRootNode().host.shadowRoot.getElementById("results").getElementsByTagName("article")[0].children;
                var filter = inputElement.value.toUpperCase();
                for (let i = 0; i < targets.length; i++) {
                    var txtValue = targets[i].textContent || targets[i].innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        targets[i].style.display = "";
                    } else {
                        targets[i].style.display = "none";
                    }
                }
            }
        }
        else {
            inputElement.onkeypress = e => {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    window.location = `${window.location.origin}/search?query=${inputElement.value}`
                }
            }
        }
        // Appends the input into the shadow root.
        shadowRoot.appendChild(inputElement);
    }
}

customElements.define('search-bar', SearchBar);
