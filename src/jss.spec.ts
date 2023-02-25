import { INavimi_Components } from "./@types/INavimi_Components";
import { INavimi_CSSs } from "./@types/INavimi_CSSs";
import { INavimi_Fetch } from "./@types/INavimi_Fetch";
import { INavimi_Helpers } from "./@types/INavimi_Helpers";
import { INavimi_JSs } from "./@types/INavimi_JSs";
import { INavimi_State } from "./@types/INavimi_State";
import { INavimi_Templates } from "./@types/INavimi_Templates";
import jss from "./jss";

describe('jss.spec', () => {
    let navimi_jss: INavimi_JSs;
    const abortControllerMock = {
        signal: {}
    } as any;

    const fetch_data_mock = {} as any;
    const navimi_fetch_mock = {
        fetchFile: (url: string) => {
            if (fetch_data_mock[url]) {
                return Promise.resolve(fetch_data_mock[url]);
            }

            return Promise.reject(new Error(`File ${url} not found`));
        },
        getErrors: (url: string): void => undefined
    } as unknown as INavimi_Fetch;

    const navimi_helpers_mock = {
        setTitle: jest.fn(),
        setNavimiLinks: jest.fn()
    } as unknown as INavimi_Helpers;

    const navimi_css_mock = {
        fetchCss: jest.fn(() => Promise.resolve()),
        insertCss: jest.fn()
    } as unknown as INavimi_CSSs;

    const navimi_templates_mock = {
        getTemplate: jest.fn(),
        fetchTemplate: jest.fn(() => Promise.resolve())
    } as unknown as INavimi_Templates;

    const navimi_components_mock = {
        registerComponent: jest.fn().mockReturnValue({}),
    } as unknown as INavimi_Components;

    const navimi_state_mock = {
        setState: jest.fn(),
        getState: jest.fn(),
        unwatchState: jest.fn(),
        watchState: jest.fn()
    } as unknown as INavimi_State;

    beforeAll(() => {
        navimi_jss = new jss() as INavimi_JSs;

        fetch_data_mock['/js/service1.js'] = `
        (() => {
            const testService1 = (param) => {
                return param;
            }
            return { testService1 };
        })();`;

        fetch_data_mock['/js/service2.js'] = `
        (() => {
            const testService2 = (param) => {
                return param;
            }
            return { testService2 };
        })();`;

        fetch_data_mock['/js/service3.js'] = `
        (() => {
            const testService3 = (param) => {
                return param;
            }
            return { testService3 };
        })();`;

        fetch_data_mock['/js/service4.js'] = `
        (() => {
            const testService4 = (param) => {
                return param;
            }
            return { testService4 };
        })();`;

        fetch_data_mock['/js/component1.js'] = `
        (() => {
            return class ComponentClass {
                render() {
                    return '<span>OK</span>'
                }
            };
        })();`;

        fetch_data_mock['/js/component2.js'] = `
        (() => {
            return class ComponentClass {
                render() {
                    return '<span>OK</span>'
                }
            };
        })();`;

        fetch_data_mock['/js/component3.js'] = `
        (() => {
            return ['service1', 'service2', 'service3', 'service4', class ComponentClass {

                constructor(props, navimiFunctions, { service1: a, service2, service3, service4 }) {
                    this.nfx = navimiFunctions;                    
                    this.service1 = a;
                    this.service2 = service2;
                    this.service3 = service3;
                    this.service4 = service4;
                    this.props = props;
                }

                render() {
                    return '<span>OK</span>'
                }
            }];
        })();`;

        navimi_jss.init(
            navimi_helpers_mock,
            navimi_fetch_mock,
            navimi_css_mock,
            navimi_templates_mock,
            navimi_state_mock,
            navimi_components_mock,
            {
                services: {
                    'service1': '/js/service1.js',
                    'service2': '/js/service2.js',
                    'service3': '/js/service3.js',
                    'service4': '/js/service4.js'
                },
                components: {
                    'component-1': '/js/component1.js',
                    'component-2': '/js/component2.js',
                    'component-3': '/js/component3.js'
                }
            }
        );
    });

    test('isJsLoaded', () => {

        expect(navimi_jss.isJsLoaded('')).toBeFalsy();

    });

    test('fetchJS', (done) => {

        fetch_data_mock['/js/test.js'] = `
            (() => {
                return class main {
                    test() {
                        return "OK";
                    }
                };
            })();`;

        navimi_jss.fetchJS(abortControllerMock, ['/js/test.js'], 'javascript').then(() => {
            expect(navimi_jss.isJsLoaded('/js/test.js')).toBeTruthy();
            done();
        });

    });

    test('getInstance', () => {

        const js = navimi_jss.getInstance('/js/test.js');
        const instance = new js();

        expect(instance.test()).toBe('OK');

    });

    test('load route', (done) => {

        const url = '/js/route.js';

        fetch_data_mock[url] = `
            (() => {
                return class main {

                    constructor(navimiFunctions) {
                        this.nfx = navimiFunctions;
                        this.context = null;
                    }

                    onEnter(context) {
                        this.context = context;
                    }

                    onLeave() {
                        this.context = null;
                    }

                };
            })();`;

        navimi_jss.fetchJS(abortControllerMock, [url], 'route').then(route => {
            route.onEnter();
            expect(route.nfx).toBeDefined();
            expect(route.context).not.toBeNull();
            route.onLeave();
            expect(route.context).toBeNull();
            done();
        });

    });

    test('initRoute', () => {

        const url = '/js/route.js';
        navimi_jss.initRoute(url, { test: 'OK' });
        const js = navimi_jss.getInstance(url);
        expect(js.context).toStrictEqual({ test: 'OK' });

    });

    test('loadServices', (done) => {

        fetch_data_mock['/js/routeWithService.js'] = `
        class main {
            constructor(navimiFunctions, { service1: a, service2 }) {
                this.nfx = navimiFunctions;
                this.service1 = a;
                this.service2 = service2;
                this.context = null;
            }

            onEnter(context) {
                this.context = context;
            }
        };
        `;

        navimi_jss.loadServices(abortControllerMock, '/js/routeWithService.js', ['service1', 'service2']);
        navimi_jss.fetchJS(abortControllerMock, ['/js/routeWithService.js'], 'route').then(route => {
            expect(route.service1.testService1('OK')).toBe('OK');
            expect(route.service2.testService2('OK')).toBe('OK');
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service1.js']['/js/routeWithService.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service2.js']['/js/routeWithService.js']).toBeDefined();
            done();
        });

    });

    test('loadServices in-line', (done) => {

        fetch_data_mock['/js/routeWithServiceInline.js'] = `
            ['service1', 'service2', 'service3', 'service4', class main {

                constructor(navimiFunctions, { service1: a, service2, service3, service4 }) {
                    this.nfx = navimiFunctions;                    
                    this.service1 = a;
                    this.service2 = service2;
                    this.service3 = service3;
                    this.service4 = service4;
                    this.context = null;
                }

                onEnter(context) {
                    this.context = context;
                }
            }];
        `;

        navimi_jss.fetchJS(abortControllerMock, ['/js/routeWithServiceInline.js'], 'route').then(route => {
            expect(route.service1.testService1('OK')).toBe('OK');
            expect(route.service2.testService2('OK')).toBe('OK');
            expect(route.service3.testService3('OK')).toBe('OK');
            expect(route.service4.testService4('OK')).toBe('OK');
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service1.js']['/js/routeWithServiceInline.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service2.js']['/js/routeWithServiceInline.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service3.js']['/js/routeWithServiceInline.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service4.js']['/js/routeWithServiceInline.js']).toBeDefined();
            done();
        });

    });

    test('loadComponents', (done) => {

        fetch_data_mock['/js/routeWithComponents.js'] = `
        class main {
            onEnter(context) {
                this.context = context;
            }
        };
        `;

        navimi_jss.loadComponents(abortControllerMock, '/js/routeWithComponents.js', ['component-1', 'component-2']);
        navimi_jss.fetchJS(abortControllerMock, ['/js/routeWithComponents.js'], 'route').then(() => {
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/component1.js']['/js/routeWithComponents.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/component2.js']['/js/routeWithComponents.js']).toBeDefined();
            done();
        });

    });

    test('loadComponents with services', (done) => {

        fetch_data_mock['/js/routeWithComponentsWithServices.js'] = `
        class main {
            onEnter(context) {
                this.context = context;
            }
        };
        `;

        navimi_jss.loadComponents(abortControllerMock, '/js/routeWithComponentsWithServices.js', ['component-3']);
        navimi_jss.fetchJS(abortControllerMock, ['/js/routeWithComponentsWithServices.js'], 'route').then(() => {
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/component3.js']['/js/routeWithComponentsWithServices.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service1.js']['/js/component3.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service2.js']['/js/component3.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service3.js']['/js/component3.js']).toBeDefined();
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/service4.js']['/js/component3.js']).toBeDefined();            
            done();
        });

    });

    test('route addLibrary', (done) => {

        fetch_data_mock['/css/lib1.css'] = `
            .myRedCssClass {
                color: red;
            }
        ;`;        
        fetch_data_mock['/js/lib1.js'] = `
            function funcLib1(param1, param2) {
                return [param1, param2];
            }
        ;`;

        const route = navimi_jss.getInstance('/js/routeWithService.js');
        route.nfx.addLibrary(['/js/lib1.js', '/css/lib1.css']).then(() => {
            //@ts-ignore
            const ret = window.funcLib1('1', '2');
            expect(ret).toStrictEqual(['1', '2']);

            expect(navimi_css_mock.fetchCss).toHaveBeenCalledWith(undefined, '/css/lib1.css');
            expect(navimi_css_mock.insertCss).toHaveBeenCalledWith('/css/lib1.css', 'library', true);

            done();
        });

    });

    test('route fetchJs', (done) => {

        fetch_data_mock['/js/routeJs.js'] = `
            (() => {
                test = (param) => {
                    return param;
                };
                return { test };
            })();`;

        const route = navimi_jss.getInstance('/js/routeWithService.js');
        route.nfx.fetchJS('/js/routeJs.js').then((js: any) => {
            expect(js.test('OK')).toBe('OK');
            //@ts-ignore
            expect(navimi_jss._jsDepMap['/js/routeJs.js']['/js/routeWithService.js']).toBeDefined();
            done();
        });

    });

    test('route fetchTemplate', async () => {

        const route = navimi_jss.getInstance('/js/routeWithService.js');
        await route.nfx.fetchTemplate('/html/template.html');

        expect(navimi_templates_mock.fetchTemplate).toHaveBeenCalledWith(undefined, '/html/template.html');

    });

    test('route getTemplate', () => {

        const route = navimi_jss.getInstance('/js/routeWithService.js');
        route.nfx.getTemplate('templateId');

        expect(navimi_templates_mock.getTemplate).toHaveBeenCalledWith('templateId');
        
    });

    test('route get/set state ', () => {

        const route = navimi_jss.getInstance('/js/routeWithService.js');

        const state = { key1: { key2: 'value' } };
        route.nfx.setState(state);
        route.nfx.getState('key1.key2');

        expect(navimi_state_mock.setState).toHaveBeenCalledWith(state);
        expect(navimi_state_mock.getState).toHaveBeenCalledWith('key1.key2');
        
    });

    test('route watchState', () => {

        const route = navimi_jss.getInstance('/js/routeWithService.js');

        const callback = jest.fn();
        route.nfx.watchState('key1.key2', callback);

        expect(navimi_state_mock.watchState).toHaveBeenCalledWith('route:2', 'key1.key2', callback);
        
    });

    test('route unwatchState', () => {

        const route = navimi_jss.getInstance('/js/routeWithService.js');

        route.nfx.unwatchState('key1.key2');

        expect(navimi_state_mock.unwatchState).toHaveBeenCalledWith('route:2', 'key1.key2');
        
    });

    test('route setTitle', () => {

        const route = navimi_jss.getInstance('/js/routeWithService.js');

        route.nfx.setTitle('My Title');

        expect(navimi_helpers_mock.setTitle).toHaveBeenCalledWith('My Title');
        
    });

    test('route setNavimiLinks', () => {

        const route = navimi_jss.getInstance('/js/routeWithService.js');

        route.nfx.setNavimiLinks();

        expect(navimi_helpers_mock.setNavimiLinks).toHaveBeenCalledWith();
        
    });

    test('test HOT with route with no dependencies', (done) => {

        const url = '/js/route.js';

        const data = `
        (() => {
            return class main {

                constructor(navimiFunctions) {
                    this.nfx = navimiFunctions;
                    this.context = null;
                }

                onEnter(context) {
                    this.context = context;
                }

                newFunction() {
                    return "OK";
                }
            };
        })();`;

        navimi_jss.digestHot({filePath: url , data}).then(() => {

            navimi_jss.fetchJS(abortControllerMock, [url], 'route').then(route => {
                expect(route.nfx).toBeDefined();
                expect(route.newFunction()).toBe('OK');
                done();
            });

        });

    });

    test('test HOT with javascript loaded from route', (done) => {

        const url = '/js/routeWithJs.js';

        fetch_data_mock[url] = `
            (() => {
                return class main {

                    constructor(navimiFunctions) {
                        this.nfx = navimiFunctions;
                        this.loadedJs = null;
                    }

                    async onEnter() {
                        //loads javascript from route. This js has just one function defined (check "/js/routeJs.js") at this moment
                        this.loadedJs = await this.nfx.fetchJS("/js/routeJs.js");
                    }
                };
            })();`;

        navimi_jss.fetchJS(abortControllerMock, [url], 'route').then(async route => {
            await route.onEnter();
            expect(route.loadedJs.test).toBeDefined();
            expect(route.loadedJs.newFunc).toBeUndefined();

            const newJs = `
            (() => {
                test = (param) => {
                    return param;
                };
                newFunc = () => {
                    return "OK";
                }
                return { test, newFunc };
            })();`

            navimi_jss.digestHot({filePath: '/js/routeJs.js', data: newJs}).then(() => {
    
                navimi_jss.fetchJS(abortControllerMock, ['/js/routeWithJs.js'], 'route').then(async route => {
                    await route.onEnter();
                    expect(route.loadedJs.test).toBeDefined();
                    expect(route.loadedJs.newFunc()).toBe('OK');
                    done();
                });
    
            });

        });

    });
    
    test('test HOT with service', (done) => {

        const url = '/js/service1.js';

        const data = `
        (() => {

            const testService1 = (param) => {
                return param;
            }

            const newFunction = () => {
                return "OK";
            }

            return { testService1, newFunction };
            
        })();`;     

        navimi_jss.digestHot({filePath: url, data}).then(() => {
            const oldRoute = navimi_jss.getInstance('/js/routeWithService.js');
            expect(oldRoute).toBeUndefined();

            navimi_jss.fetchJS(abortControllerMock, ['/js/routeWithService.js'], 'route').then(route => {
                expect(route.service1.newFunction()).toBe('OK');
                expect(route.service2.testService2('OK')).toBe('OK');
                //@ts-ignore
                expect(navimi_jss._jsDepMap['/js/service1.js']['/js/routeWithService.js']).toBeDefined();
                done();
            });

        });

    });

    test('test HOT with library', (done) => {

        const url = '/js/lib1.js';
        const data = `
            function funcLib1() {
                return "new return";
            }
            function funcLib2() {
                return "new func";
            }
        ;`;

        navimi_jss.digestHot({filePath: url, data}).then(() => {

            //@ts-ignore
            const funcLib1 = window.funcLib1();
            expect(funcLib1).toBe('new return');

            //@ts-ignore
            const funcLib2 = window.funcLib2();
            expect(funcLib2).toBe('new func');

            //@ts-ignore
            expect(Object.keys(navimi_jss._jsInstances).length).toBe(0);

            done();
        });

    });

});