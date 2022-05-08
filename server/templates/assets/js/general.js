document.addEventListener("DOMContentLoaded", e => {
    document.addEventListener("click", event => {
        var x = document.getElementById("dropdown-content");
        x.className = x.className.replace(" w3-show", "");
    });

    let buttons = document.getElementsByClassName("dropdown-button-click");
    Array.from(buttons).forEach(button => {
        button.addEventListener("click", (click_event) => {
            var x = document.getElementById("dropdown-content");
            if (x.className.indexOf("w3-show") == -1) {
                x.className += " w3-show";
            } else {
                x.className = x.className.replace(" w3-show", "");
            }
        })


        button.addEventListener("click", event => {
            event.stopPropagation();
        });
    })
})
