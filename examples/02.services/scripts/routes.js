new Navimi({
    "/": {
        title: "Home",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/home",
        dependsOn: ["myfx"],
        metadata: {
            templateName: "home-template"
        }
    },
    "/about": {
        title: "About",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/about",
        dependsOn: ["myfx"],
        metadata: {
            templateName: "about-template"
        }
    },
    "/contact": {
        title: "Contact",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/contact",
        dependsOn: ["myfx"],
        metadata: {
            templateName: "contact-template"
        }
    },
    "*": {
        title: "Not found",
        jsUrl: "/scripts/page.js",
        dependsOn: ["myfx"],
        metadata: {
            notFound: true
        }
    }
},
    {
        globalTemplatesUrl: "/templates/global",
        globalCssUrl: "/css/global.css",
        services: {
            "myfx": "/scripts/functions.js"
        },
    });
