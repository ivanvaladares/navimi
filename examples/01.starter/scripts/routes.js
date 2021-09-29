new Navimi({
    "/": {
        title: "Home",
        jsUrl: "/scripts/home.js",
        templatesUrl: "/templates/home",
    },
    "/about": {
        title: "About",
        jsUrl: "/scripts/about.js",
        templatesUrl: "/templates/about"
    },
    "/contact": {
        title: "Features",
        jsUrl: "/scripts/contact.js",
        templatesUrl: "/templates/contact"
    },
    "*": {
        title: "Not found",
        jsUrl: "/scripts/404.js"
    }
},
    {
        globalCssUrl: "/css/global.css",
    });
