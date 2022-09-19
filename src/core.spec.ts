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
        loadServices: jest.fn(() => Promise.resolve()),
        loadComponents: jest.fn(() => Promise.resolve()),
        fetchJS: jest.fn(() => Promise.resolve()),
        initRoute: jest.fn(() => Promise.resolve()),
    } as unknown as INavimi_JSs;

    const navimi_css_mock = {
        fetchCss: jest.fn(() => Promise.resolve()),
        insertCss: jest.fn(),
        isCssLoaded: () => true
    } as unknown as INavimi_CSSs;

    const navimi_templates_mock = {
        getTemplate: () => '<div>ok</div>',
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

    const services = {
        navimiFetch: navimi_fetch_mock,
        navimiJSs: navimi_jss_mock,
        navimiCSSs: navimi_css_mock,
        navimiTemplates: navimi_templates_mock,
        navimiMiddlewares: navimi_middleware_mock,
        navimiState: navimi_state_mock,
        navimiHot: navimi_hot_mock,
        navimiHelpers: navimi_helpers
    } as INavimi_Services;

    test('test no routes', () => {

        const c = new core({}, services, {
            onError: report_error
        });

        expect(report_error).toHaveBeenCalledWith(new Error('No route match for url: /'));

    });

    test('test HOT on port 8888', (done) => {

        const c = new core({}, services, {
            hot: 8888
        });

        setTimeout(() => {
            expect(navimi_hot_mock.init).toHaveBeenCalled();
            expect(navimi_hot_mock.openHotWs).toHaveBeenCalledWith(8888);
            done();

        }, 1100);

    });

    test('loads globalCssUrl and globalTemplatesUrl', () => {

        const c = new core({}, services, {
            globalTemplatesUrl: 'templates.html',
            globalCssUrl: 'style.css'
        });

        expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'style.css');
        expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'templates.html');

    });

    test('test nocode route with title, css and templates', (done) => {

        jest.resetAllMocks();

        window.document.write('<html><head></head><body></body></html>');

        const routeMock = {
            title: 'Home',
            cssUrl: 'home.css',
            templatesUrl: 'home.html'
        };

        const c = new core({
            '/': routeMock
        }, services, {
            globalTemplatesUrl: 'templates.html',
            globalCssUrl: 'style.css'
        });

        setTimeout(() => {
            expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'style.css');
            expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'templates.html');

            expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'home.css');
            expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'home.html');
            expect(navimi_css_mock.insertCss).toHaveBeenCalledWith('style.css', 'globalCss');
            expect(navimi_css_mock.insertCss).toHaveBeenCalledWith('home.css', 'routeCss');

            expect(window.document.body.innerHTML).toBe('<div>ok</div>');

            done();

        }, 100);
    });

    test('test route with title, js, css and templates', (done) => {

        jest.resetAllMocks();

        const routeMock = {
            title: 'Home',
            jsUrl: 'home.js',
            cssUrl: 'home.css',
            templatesUrl: 'home.html'
        };

        const c = new core({
            '/': routeMock
        }, services, {
            globalTemplatesUrl: 'templates.html',
            globalCssUrl: 'style.css'
        });

        setTimeout(() => {
            expect(navimi_jss_mock.loadServices).toHaveBeenCalledWith(undefined, 'home.js', undefined);
            expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'style.css');
            expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'templates.html');

            expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, 'home.css');
            expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, 'home.html');
            expect(navimi_jss_mock.fetchJS).toHaveBeenCalledWith(undefined, ['home.js'], 'route');
            expect(navimi_css_mock.insertCss).toHaveBeenCalledWith('style.css', 'globalCss');
            expect(navimi_jss_mock.initRoute).toHaveBeenCalledWith('home.js', {
                params: {},
                routeItem: routeMock,
                url: '/',
            });
            expect(navimi_css_mock.insertCss).toHaveBeenCalledWith('home.css', 'routeCss');

            done();

        }, 100);
    });

    test('test onBeforeRoute and onAfterRoute', (done) => {

        jest.resetAllMocks();

        window.document.write('<html><head></head><body></body></html>');

        const onBeforeRoute = jest.fn();
        const onAfterRoute = jest.fn();

        const c = new core({
            '/': {
                title: 'Home',
                cssUrl: 'home.css',
                templatesUrl: 'home.html'
            }
        }, services, {
            onBeforeRoute,
            onAfterRoute
        });

        setTimeout(() => {

            expect(window.document.body.innerHTML).toBe('<div>ok</div>');

            expect(onBeforeRoute).toHaveBeenCalled();
            expect(onAfterRoute).toHaveBeenCalled();

            done();

        }, 100);
    });

    test('test navigateTo', (done) => {

        jest.resetAllMocks();

        window.document.write('<html><head></head><body></body></html>');

        const onBeforeRoute = jest.fn();
        const onAfterRoute = jest.fn();

        const c = new core({
            '/': {
                title: 'Home',
                cssUrl: 'home.css',
                templatesUrl: 'home.html',
                jsUrl: 'home.js'
            },
            '/about': {
                title: 'About',
                cssUrl: 'about.css',
                templatesUrl: 'about.html',
                jsUrl: 'about.js'
            }
        }, services, {
            onBeforeRoute,
            onAfterRoute
        });

        setTimeout(() => {

            expect(window.document.title).toBe('Home');

            //@ts-ignore
            window.navigateTo('/about');

            setTimeout(() => {

                expect(window.document.title).toBe('About');

                done();

            }, 100);

        }, 100);

    });

});