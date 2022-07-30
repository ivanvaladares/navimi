new Navimi({
    "/": {
        title: "Home",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/home.html",
        metadata: {
            templateName: "home-template"
        }
    },
    "/about": {
        title: "About",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/about.html",
        metadata: {
            templateName: "about-template"
        }
    },
    "/contact": {
        title: "Contact",
        jsUrl: "/scripts/page.js",
        templatesUrl: "/templates/contact.html",
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
        globalTemplatesUrl: "/templates/global.html",
        globalCssUrl: "/css/global.css",
        services: {
            "myfx": "/scripts/service1.js",
            "linksFx": "/scripts/service2.js"
        },        
        middlewares: [
            //that's where you would check if a route is protected and the user is logged in
            (ctx, next) => {
                console.log("middleware 1", ctx);
                const user = sessionStorage["user"];
                if (ctx.routeItem.metadata.isProtected && !user) {
                    return next("/login");
                }
                next();
            },
            async (ctx, next) => {
                if (document.querySelector("#global-template")) {
                    document.querySelector("#div-content").innerHTML = "loading..."
                    console.log("wait 100ms", ctx);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }           
                console.log("middleware 2", ctx);
                next();
            },
            (ctx, next) => {
                console.log("middleware 3", ctx);
                //adding common services to all routes
                ctx.routeItem.services = ["myfx", "linksFx"];
                next();
            },
        ],
    });
