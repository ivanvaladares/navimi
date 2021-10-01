new Navimi({
    "/": {
        title: "Home",
        templatesUrl: "/templates/home.html",
    },
    "/about": {
        title: "About",
        templatesUrl: "/templates/about.html"
    },
    "/contact": {
        title: "Contact",
        templatesUrl: "/templates/contact.html"
    },
    "*": {
        title: "Not found",
        templatesUrl: "/templates/404.html"
    }
},
    {
        globalCssUrl: "/css/global.css",
    });
