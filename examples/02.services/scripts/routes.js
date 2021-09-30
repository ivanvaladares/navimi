new Navimi({
    "/": {
        title: "Home",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/home.html",
        dependsOn: ["myfx"],
        metadata: {
            templateName: "home-template"
        }
    },
    "/about": {
        title: "About",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/about.html",
        dependsOn: ["myfx"],
        metadata: {
            templateName: "about-template"
        }
    },
    "/contact": {
        title: "Contact",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/contact.html",
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
        globalTemplatesUrl: "/templates/global.html",
        globalCssUrl: "/css/global.css",
        services: {
            "myfx": "/scripts/functions.js"
        },
    });
