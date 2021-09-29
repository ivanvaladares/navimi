new Navimi({
    "/": {
        title: "Home",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/home",
        cssUrl: "/css/home.css",
        metadata: {
            templateName: "home-template"
        }
    },
    "/about": {
        title: "About",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/about",
        cssUrl: "/css/about.css",
        metadata: {
            templateName: "about-template"
        }
    },
    "/contact": {
        title: "Contact",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/contact",
        cssUrl: "/css/contact.css",
        metadata: {
            templateName: "contact-template"
        }
    },
    "*": {
        title: "Not found",
        jsUrl: "/scripts/page.js",
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
        middlewares: [
            async (ctx, navigateTo, next) => {
                //show loading
                if (document.querySelector("#global-template")) {
                    document.querySelector("#div-content").innerHTML = "loading..."
                }
                //adding common service to all routes
                ctx.routeItem.dependsOn = ["myfx"];
                next();
            }
        ],
    });
