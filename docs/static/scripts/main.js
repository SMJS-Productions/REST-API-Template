// @ts-check
/// <reference path="index.d.ts" />

/**
 * @param {string} id 
 */
function navigate(id) {
    const element = document.getElementById(id || document.getElementsByClassName("page")[0].id);
    const pageId = element.parentElement == document.body ? element.id : element.parentElement.id;
    const nav = document.getElementById("nav");

    document.getElementById("menu-bar").classList.remove("open");
    nav.classList.remove("open");

    [
        ...document.getElementsByClassName("page")
    ].forEach((page) => page.classList[page.id == pageId ? "add" : "remove"]("active"));
    [
        ...nav.getElementsByTagName("a")
    ].forEach((link) => link.classList[link.href.split("#").reverse()[0] == pageId ? "add": "remove"]("highlight"));
    
    element.scrollIntoView();
    document.getElementsByTagName("title")[0].innerText = `Documentations - ${
        document.getElementById(pageId).getElementsByTagName("h1")[0].innerText
    }`;
}

const nav = document.createElement("div");
const menu = document.createElement("span");
const menuBar = document.createElement("div");

nav.id = "nav";
nav.innerHTML = "<h2>Documentations</h2>";
menuBar.id = "menu-bar";
menu.innerHTML = "<i class=\"fa-solid fa-bars\"></i>";
menu.classList.add("menu");
menu.addEventListener("click", () => {
    document.getElementById("nav").classList.toggle("open");
    document.getElementById("menu-bar").classList.toggle("open");
});

[...document.getElementsByClassName("page")].forEach((element) => {
    element.innerHTML = marked.parse(element.innerHTML);

    const link = document.createElement("a");
    const title = [...element.getElementsByTagName("h1")][0];

    element.id = title.id;
    link.href = `#${title.id}`;
    link.innerHTML = title.innerText;
    link.addEventListener("click", () => navigate(element.id));
    nav.appendChild(link);
    title.removeAttribute("id");
});

for (let i = 1; i <= 3; i++) {
    [...document.getElementsByTagName(`h${i}`)].forEach((element) => {
        const link = document.createElement("span");

        if (element.id) {
            element.id = `${element.parentElement.id}-${element.id}`;
        } else {
            element.id = `${element.parentElement.id}-${
                // @ts-ignore
                element.innerText.replace(/\//g, "-")
                    .replace(/:/g, "p")
                    .replace(/\?/g, "q")
                    .replace(/\s/g, "")
                    .toLowerCase()
            }`;
        }

        link.innerHTML = "<i class=\"fa-solid fa-link\"></i>";
        link.classList.add("link");
        link.addEventListener("click", () => location.href = `#${element.id}`);
        element.appendChild(link);
    });
}

menuBar.appendChild(menu);
document.body.appendChild(menuBar);
document.body.appendChild(nav);
navigate(location.hash.slice(1));