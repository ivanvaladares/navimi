describe('navimi.spec', () => {
    const { Navimi } = require('./navimi');

    const routes = {
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
        "*": {
            title: "Not found",
            jsUrl: "/scripts/404.js"
        }
    } as INavimi_KeyList<INavimi_Route>;

    const options = {
        globalCssUrl: "/css/global.css",
    } as INavimi_Options;


    test('Test constructor', () => {

        const initMock = jest.fn(() => {
            return {
                init: jest.fn()
            }
        });

        //@ts-ignore
        window.__Navimi_Fetch = initMock;
        //@ts-ignore
        window.__Navimi_Dom = initMock;
        //@ts-ignore
        window.__Navimi_CSSs = initMock;
        //@ts-ignore
        window.__Navimi_JSs = initMock;
        //@ts-ignore
        window.__Navimi_Templates = initMock
        //@ts-ignore
        window.__Navimi_Middlewares = initMock;
        //@ts-ignore
        window.__Navimi_State = initMock;
        //@ts-ignore
        window.__Navimi_Hot = initMock;
        //@ts-ignore
        window.__Navimi_Helpers = initMock;
        //@ts-ignore
        window.__Navimi_Components = initMock;
        
        let coreReturn = {} as any;
        //@ts-ignore
        window.__Navimi_Core = jest.fn((routes, services, options) => {
            coreReturn = { routes, services, options };
            return {}
        });;

        new Navimi(routes, options);

        //@ts-ignore
        expect(window.__Navimi_Core).toHaveBeenCalled();
        expect(coreReturn.routes).toEqual(routes);
        expect(coreReturn.options).toEqual(options);

    });

    test('Test inject services', (done) => {

        const services = {
            navimiFetch: { init: () => { } },
            navimiJSs: { init: () => { } },
            navimiCSSs: { init: () => { } },
            navimiDom: { init: () => { } },
            navimiTemplates: { init: () => { } },
            navimiState: { init: () => { } },
            navimiHot: { init: () => { } },
            navimiMiddlewares: {},
            navimiHelpers: {},
            navimiComponents: { init: () => { } },
        } as unknown as INavimi_Services;

        new Navimi(routes, options, services, 
            (_routes: INavimi_KeyList<INavimi_Route>, _services: INavimi_Services, _options?: INavimi_Options) => {

            expect({
                routes: _routes,
                services: _services,
                options: _options
            }).toEqual({
                routes,
                services,
                options
            });

            done();
        });

    });


});