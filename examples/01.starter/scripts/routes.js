new Navimi({
    "/": {
        title: "Home",
        jsUrl: "/scripts/home.js",
        templatesUrl: "/templates/home.html",
    },
    "/about": {
        title: "About",
        jsUrl: "/scripts/about.js",
        templatesUrl: "/templates/about.html"
    },
    "/contact": {
        title: "Contact",
        jsUrl: "/scripts/contact.js",
        templatesUrl: "/templates/contact.html"
    },
    "*": {
        title: "Not found",
        jsUrl: "/scripts/404.js"
    }
},
    {
        globalCssUrl: "/css/global.css",
    });
