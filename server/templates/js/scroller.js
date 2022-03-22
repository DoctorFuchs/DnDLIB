init_eventlisteners() {
  var elems = document.getElementsByTagName("a");
  for (let elem in elems) {
    if (elem.href.startsWith("#")) {
      elem.addEventListener("click", e=> {
        e.preventDefault();
        var scroll_object = document.querySelector(e.target.href);
        scroll_object.scrollIntoView({ behavior: 'smooth', block: 'end'});
      })
    }
  }
}

document.addEventListener("DOMContentLoaded", e=> {
  init_eventlisteners();
})
