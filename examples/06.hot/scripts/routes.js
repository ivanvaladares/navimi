new Navimi({
    '/': {
        title: 'Home',
        jsUrl: '/scripts/page.js',
        templatesUrl: '/templates/home.html',
        metadata: {
            templateName: 'home-template'
        },
        components: ['click-component', 'child-component'],
    },
    '/about': {
        title: 'About',
        jsUrl: '/scripts/page.js',
        templatesUrl: '/templates/about.html',
        metadata: {
            templateName: 'about-template'
        }
    },
    '/contact': {
        title: 'Contact',
        jsUrl: '/scripts/page.js',
        templatesUrl: '/templates/contact.html',
        metadata: {
            templateName: 'contact-template'
        }
    },
    '*': {
        title: 'Not found',
        jsUrl: '/scripts/page.js',
        metadata: {
            notFound: true
        }
    }
},
    {
        globalTemplatesUrl: '/templates/global.html',
        globalCssUrl: '/css/global.css',
        components: {
            'click-component': '/scripts/components/click-component.js',
            'child-component': '/scripts/components/child-component.js',
        },
        services: {
            'myfx': '/scripts/service1.js',
            'linksFx': '/scripts/service2.js'
        },        
        middlewares: [
            (ctx, next) => {
                //show loading
                // if (document.querySelector("#global-template")) {
                //     document.querySelector("#div-content").innerHTML = "loading..."
                // }
                //adding common service to all routes
                ctx.routeItem.services = ['myfx', 'linksFx'];
                next();
            }
        ],
        hot: 5000,
    });
