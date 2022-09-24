new Navimi({
    "/": {
        title: "Home",
        templatesUrl: "/templates/home",
        components: ["click-component", "child-component"],
    },
    "/about": {
        title: "About",
        templatesUrl: "/templates/about.html",
        components: ["child-component"],
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
        components: {
            "click-component": "/scripts/components/click-component.js",
            "child-component": "/scripts/components/child-component.js",
        },
        services: {
            "service2": "/scripts/service2.js"
        },
    }); 
