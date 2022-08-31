new Navimi({
    "/": {
        title: "Home",
        jsUrl: "/scripts/home.js",
        templatesUrl: "/templates/home.html",
        cssUrl: "/css/home.css",
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
    "/libs-test": {
        title: "Libs test",
        jsUrl: "/scripts/libs-test.js",
        templatesUrl: "/templates/libs-test.html"
    },
    "/state-test": {
        title: "State test",
        jsUrl: "/scripts/state-test.js",
        templatesUrl: "/templates/state-test.html"
    },
    "/Path-test/:p1/:p2": {
        title: "Path test",
        jsUrl: "/scripts/path-test.js",
        templatesUrl: "/templates/path-test.html"
    },
    "/css-test": {
        title: "Css test",
        jsUrl: "/scripts/css-test.js",
        templatesUrl: "/templates/css-test.html"
    },
    "*": {
        title: "Not found",
        jsUrl: "/scripts/404.js"
    }
},
    {
        globalCssUrl: "/css/global.css",
        globalTemplatesUrl: "/templates/global.html",
        services: {
            "myfx": "/scripts/functions.js"
        },        
        middlewares: [
            (ctx, next) => {
                ctx.routeItem.services = ["myfx"];
                next();
            },
            (ctx, next) => {
                if (ctx.params && ctx.params.queryString && ctx.params.queryString.notFound) {
                    return next("/notFound");
                }
                next();
            }
        ],
    });
