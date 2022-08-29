describe('core.spec', () => {
    const { core } = require('./core');
    const { helpers } = require('./helpers');

    window["AbortController"] = undefined;

    const report_error = jest.fn();

    const navimi_helpers = new helpers();

    const fetch_data_mock = {} as any;
    const navimi_fetch_mock = {
        fetchFile: (url: string) => {
            if (fetch_data_mock[url]) {
                return Promise.resolve(fetch_data_mock[url]);
            }

            return Promise.reject(new Error(`File ${url} not found`));
        },
        getErrors: (url: string) => undefined
    } as INavimi_Fetch;

    const navimi_jss_mock = {
        getInstance: jest.fn(),
        loadDependencies: jest.fn(() => Promise.resolve()),
        fetchJS: jest.fn(() => Promise.resolve()),
        initRoute: jest.fn(() => Promise.resolve()),
    } as unknown as INavimi_JSs;

    const navimi_css_mock = {
        fetchCss: jest.fn(() => Promise.resolve()),
        insertCss: jest.fn(),
        isCssLoaded: () => true
    } as unknown as INavimi_CSSs;

    const navimi_templates_mock = {
        getTemplate: jest.fn(),
        fetchTemplate: jest.fn(() => Promise.resolve()),
        isTemplateLoaded: () => true
    } as unknown as INavimi_Templates;

    const navimi_middleware_mock = {
        addMiddlewares: jest.fn(),
        executeMiddlewares: () => Promise.resolve(),
    } as unknown as INavimi_Middlewares;

    const navimi_hot_mock = {
        init: jest.fn(),
        openHotWs: jest.fn(),
    } as unknown as INavimi_Hot;

    const navimi_state_mock = {
        setState: jest.fn(),
        getState: jest.fn(),
        unwatchState: jest.fn(),
        watchState: jest.fn()
    } as unknown as INavimi_State;

    const navimi_components_mock = {
        registerComponent: jest.fn()
    } as unknown as INavimi_Components;

    const services = {
        navimiFetch: navimi_fetch_mock,
        navimiJSs: navimi_jss_mock,
        navimiCSSs: navimi_css_mock,
        navimiTemplates: navimi_templates_mock,
        navimiMiddlewares: navimi_middleware_mock,
        navimiState: navimi_state_mock,
        navimiHot: navimi_hot_mock,
        navimiHelpers: navimi_helpers,
        navimiComponents: navimi_components_mock
    };


    test('test no routes', () => {

        const c = new core({}, services, {
            onError: report_error
        });

        expect(report_error).toHaveBeenCalledWith(new Error('No route match for url: /'));

    });

    // test('test HOT on port 8888', (done) => {

    //     const c = new core({}, services, {
    //         hot: 8888
    //     });

    //     setTimeout(() => {
    //         expect(navimi_hot_mock.init).toHaveBeenCalled();
    //         expect(navimi_hot_mock.openHotWs).toHaveBeenCalledWith(8888);
    //         done();

    //     }, 1100);

    // });

    test('loads globalCssUrl and globalTemplatesUrl', () => {

        const c = new core({}, services, {
            globalTemplatesUrl: 'templates.html',
            globalCssUrl: 'style.css'
        });

        expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'style.css');
        expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'templates.html');

    });

    test('test route with title, js, css and templates', (done) => {        
        
        jest.resetAllMocks();

        const c = new core({
            '/': {
                title: 'Home',
                jsUrl: 'home.js',
                cssUrl: 'home.css',
                templatesUrl: 'home.html'
            }
        }, services, {
            globalTemplatesUrl: 'templates.html',
            globalCssUrl: 'style.css'
        });

        setTimeout(() => {
            //expect(navimi_jss_mock.loadDependencies).toHaveBeenCalledWith(undefined, 'home.js', undefined, undefined);
            expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'style.css');
            expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'templates.html');

            expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'home.css');
            expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'home.html');
            expect(navimi_jss_mock.fetchJS).toHaveBeenCalledWith(undefined, ['home.js'], 'route');
            expect(navimi_css_mock.insertCss).toHaveBeenCalledWith('style.css', 'globalCss');
            expect(navimi_jss_mock.initRoute).toHaveBeenCalledWith('home.js', {
                "params": {},
                "routeItem": {
                    "cssUrl": "home.css",
                    "jsUrl": "home.js",
                    "templatesUrl": "home.html",
                    "title": "Home",
                },
                "url": "/",
            });
            expect(navimi_css_mock.insertCss).toHaveBeenCalledWith('home.css', 'routeCss');	

            done();

        }, 100);
    });

});