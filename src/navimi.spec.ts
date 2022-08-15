describe('navimi.spec', () => {
    const { Navimi } = require('./navimi');

    const fetch_data_mock = {} as any;

    beforeAll(() =>
        global.fetch = jest.fn((url: string) =>
            new Promise((resolve, reject) => {
                if (fetch_data_mock[url]) {
                    resolve({
                        text: async () => { return Promise.resolve(fetch_data_mock[url]); },
                        ok: true
                    } as any);
                    return;
                }
                reject(new Error(`File ${url} not found`));
            })
        )
    );

    test('Test constructor mock', (done) => {

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
        };

        const options = {
            globalCssUrl: "/css/global.css",
        };

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
        };

        new Navimi(routes, options, services as any, 
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