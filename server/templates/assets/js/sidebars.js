import Cookies from './js.cookie.mjs';

class BookmarkManager {
    constructor() {
        this.bookmark_elem = document.getElementById("bookmarks");
        if (Cookies.get("bookmarks") == null) {
            Cookies.set("bookmarks", JSON.stringify({}))
        }
    }

    load() {
        let bookmarks = this.getBookmarkArray();

        if (bookmarks.length == 0) {
            this.bookmark_elem.innerHTML = "";
            return;
        }

        let header = document.createElement("h1");
        header.innerText = "Bookmarks";

        this.bookmark_elem.innerHTML = "";
        this.bookmark_elem.appendChild(header);

        bookmarks.forEach(bookmark => {
            let child = document.createElement("a");
            child.href = bookmark.url;
            child.innerText = bookmark.name;
            child.classList.add("w3-bar-item");
            child.classList.add("w3-button");
            child.classList.add("w3-right-align");
            this.bookmark_elem.appendChild(child);
        })
    }

    getBookmarkJson() {
        return JSON.parse(Cookies.get("bookmarks"));
    }

    getBookmarkArray() {
        return Array.from(this.getBookmarkJson());
    }

    add(name, url) {
        let bookmarks = this.getBookmarkArray();
        bookmarks.push({
            "name":name,
            "url":url
        })
        Cookies.set("bookmarks", JSON.stringify(bookmarks))
        this.load();
    }

    remove(name, url) {
        let bookmarks = this.getBookmarkArray();
        bookmarks.forEach(function (bookmark, index) {
            if (bookmark.url == url) {
                bookmarks.splice(index, 1);
            }
        })
        Cookies.set("bookmarks", JSON.stringify(bookmarks));
        this.load();
    }

    change(name, url) {
        if (this.isBookmark(url)) {
            this.remove(name, url);
            console.log("removed");
        }
        else {
            this.add(name, url);
            console.log("added");
        }
    }

    isBookmark(url) {
        let bookmarks = this.getBookmarkArray();
        let result = false;
        bookmarks.forEach(bookmark => {
            if (bookmark.url === url) {
                result = true;
            }
        })
        return result;
    }
}

document.addEventListener("DOMContentLoaded", e => {
    const BOOKMARK_MANAGER = new BookmarkManager();
    BOOKMARK_MANAGER.load();
    Array.from(document.getElementsByClassName("bookmark-button")).forEach(element => {
        element.addEventListener("click", e => {
            BOOKMARK_MANAGER.change(e.target.getAttribute("name"), window.location.pathname);
        })
    })
})
