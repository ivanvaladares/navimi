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
            "myfx": "/scripts/functions.js"
        },        
        middlewares: [
            //that's where you would check if a route is protected and the user is logged in
            (ctx, navigateTo, next) => {
                console.log("middleware 1", ctx);
                const user = sessionStorage["user"];
                if (ctx.routeItem.metadata.isProtected && !user) {
                    navigateTo("/login");
                    return;
                }
                next();
            },
            async (ctx, navigateTo, next) => {
                if (document.querySelector("#global-template")) {
                    document.querySelector("#div-content").innerHTML = "loading..."
                    console.log("wait 100ms", ctx);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }           
                console.log("middleware 2", ctx);
                next();
            },
            (ctx, navigateTo, next) => {
                console.log("middleware 3", ctx);
                //adding common service to all routes
                ctx.routeItem.dependsOn = ["myfx"];
                next();
            },
        ],
    });
