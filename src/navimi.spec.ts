import {
    INavimi_Route,
    INavimi_Options,
    INavimi_Services
} from "./@types/Navimi";

jest.mock('./core', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./fetch', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./csss', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./jss', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./templates', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./state', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./hot', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./components', () => jest.fn(() => ({ init: jest.fn() })));
jest.mock('./middlewares', () => jest.fn());
jest.mock('./helpers', () => jest.fn());

import Navimi from "./navimi";

describe('navimi.spec', () => {
    const routes = {
        '/': {
            title: 'Home',
            jsUrl: '/scripts/home.js',
            templatesUrl: '/templates/home.html',
        },
        '/about': {
            title: 'About',
            jsUrl: '/scripts/about.js',
            templatesUrl: '/templates/about.html'
        },
        '*': {
            title: 'Not found',
            jsUrl: '/scripts/404.js'
        }
    } as Record<string, INavimi_Route>;

    const options = {
        globalCssUrl: '/css/global.css',
    } as INavimi_Options;


    test('Test constructor', () => {

        const navimi = new Navimi(routes, options);
        expect(navimi).toBeDefined();

    });

    test('Test inject services', (done) => {

        const services = {
            navimiFetch: { init: () => { } },
            navimiJSs: { init: () => { } },
            navimiCSSs: { init: () => { } },
            navimiTemplates: { init: () => { } },
            navimiState: { init: () => { } },
            navimiHot: { init: () => { } },
            navimiComponents: { init: () => { } },
            navimiMiddlewares: {},
            navimiHelpers: {}
        } as unknown as INavimi_Services;

        new Navimi(routes, options, services, (_routes, _services, _options) => {

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
