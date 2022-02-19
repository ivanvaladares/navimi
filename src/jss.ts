namespace __Navimi_JSs {
    
    const navimiLoaderNS: string = "__navimiLoader";
    const callBackNS: string = "_jsLoaderCallback";
    const promiseNS: string = "_promise_";
    
    let navimiLoader: any;
    let loadedJSs: { [url: string]: boolean | string } = {};
    let externalJSs: { [url: string]: InstanceType<any> } = {};
    let routesJSs: { [url: string]: InstanceType<any> } = {};
    let externalJSsMap: { [url: string]: { [url: string]: boolean } } = {};
    let externalTemplatesMap: { [url: string]: { [url: string]: boolean } } = {};
    let routesJSsServices: { [url: string]: string[] } = {};

    let navigateTo: (url: string, params?: { [key: string]: any }) => void;
    let options: Options;

    export const init = (config: any): void => {
        navigateTo = config.navigateTo;
        options = config.options;
        
        // @ts-ignore
        navimiLoader = window[navimiLoaderNS] = {
            [callBackNS]: instantiateJS, // initialize JS loader namespace
        };

    };

    const awaitJS = (jsUrl: string) => {
        return new Promise<InstanceType<any>>((resolve, reject) => {

            const loadInterval = setInterval(() => {
                if (routesJSs[jsUrl]) {
                    clearInterval(loadInterval);
                    return resolve(routesJSs[jsUrl]);
                }
                if (navimiLoader[promiseNS + jsUrl] === undefined) {
                    clearInterval(loadInterval);
                    return reject(`Error loading file! ${jsUrl}`);
                }
            }, 50);

        });
    };

    const fetch = (abortController: AbortController, url: string, external?: boolean): Promise<void | void[]> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let jsCode: string;
                if (typeof loadedJSs[url] === "string") {
                    jsCode = loadedJSs[url] as string;
                } else {
                    jsCode = await __Navimi_Fetch.fetchFile(url, {
                        headers: {
                            Accept: "application/javascript"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });

                }

                loadedJSs[url] = external ? true : jsCode;
            
                insertJS(url, jsCode, external);

                if (external === undefined) {
                    navimiLoader[promiseNS + url](true); // resolve the promise - script is loaded
                }

                resolve();
                
            } catch (ex) {
                reject(ex);
            }
        });
    };

    const instantiateJS = async (
        jsUrl: string, 
        external: boolean, //todo: change to isRouteScript
        JsClass: InstanceType<any>): Promise<void> => {

        const promiseToResolve: any = navimiLoader[promiseNS + jsUrl];
        const promiseToReject: any = navimiLoader[promiseNS + jsUrl + "_reject"];

        // remove callbacks
        setTimeout(() => {
            delete navimiLoader[promiseNS + jsUrl];
            delete navimiLoader[promiseNS + jsUrl + "_reject"];
        }, 10);        

        if (external) {
            // keep this instance to reuse later
            externalJSs[jsUrl] = JsClass;
            promiseToResolve && promiseToResolve(Object.freeze(JsClass));
            return;
        }

        try {
            __Navimi_State.unwatchState(jsUrl);

            const routerFunctions = Object.freeze({
                addLibrary: __Navimi_Dom.addLibrary,
                setTitle: __Navimi_Dom.setTitle,
                navigateTo,
                getTemplate: __Navimi_Templates.getTemplate,
                fetchJS: (url: string | string[]) => {
                    const urls = Array.isArray(url) ? url : [url];
                    urls.map(u => {
                        externalJSsMap[u] = {
                            ...externalJSsMap[u] || {},
                            [jsUrl]: true
                        };
                    });
                    return fetchJS(undefined, urls, true);
                },
                fetchTemplate: (url: string) => {
                    const urls: string[] = Array.isArray(url) ? url : [url];
                    urls.map((u: string) => {
                        externalTemplatesMap[u] = {
                            ...externalTemplatesMap[u] || {},
                            [jsUrl]: true
                        };
                    });
                    return __Navimi_Templates.fetchTemplate(undefined, urls);
                },
                setState: __Navimi_State.setState,
                getState: __Navimi_State.getState,
                setNavimiLinks: () => __Navimi_Dom.setNavimiLinks(navigateTo),
                unwatchState: (key: string) => __Navimi_State.unwatchState(jsUrl, key),
                watchState: (key: string, callback: (state: { [key: string]: any }) => void) =>
                    __Navimi_State.watchState(jsUrl, key, callback),
            });

            let services: { [serviceName: string]: InstanceType<any> };

            if (routesJSsServices[jsUrl].length > 0) {
                while (true) {
                    if (routesJSsServices[jsUrl].map((sn: string) =>
                        externalJSs[options.services[sn]] === undefined).indexOf(true) === -1) {
                        break;
                    }
                    if (routesJSsServices[jsUrl].map(sn =>
                        options.services[sn]).find(su => __Navimi_Fetch.loadErrors[su])) {
                        return;
                    }
                    await __Navimi_Helpers.timeout(10);
                }

                routesJSsServices[jsUrl].map((sn: string) => {
                    services = {
                        ...services,
                        [sn]: externalJSs[options.services[sn]]
                    };
                });
            }

            let jsInstance = new JsClass(routerFunctions, services);

            //keep this instance to reuse later
            routesJSs[jsUrl] = jsInstance;
            promiseToResolve && promiseToResolve(jsInstance);

        } catch (error) {
            promiseToReject && promiseToReject(error);

        }

    };
    
    export const isJsLoaded = (url: string): boolean => {
        return loadedJSs[url] !== undefined;
    };

    export const unloadJs = (url: string, jsCode: string, isRouteJs: boolean, currentJS: string, callback: any): void => {
        isRouteJs && delete routesJSs[url];
        !isRouteJs && delete externalJSs[url];
        !isRouteJs && delete routesJSs[currentJS];

        navimiLoader[promiseNS + url] = () => {
            callback();
        };

        insertJS(url, jsCode, !isRouteJs);

    };

    export const isDependent = (url: string, jsUrl: string): boolean => {
        return Object.keys(externalTemplatesMap[url] || {}).find(s => s === jsUrl) !== undefined ||
            Object.keys(externalJSsMap[url] || {}).find(s => s === jsUrl) !== undefined;
    }

    export const getInstance = (url: string): InstanceType<any> => {
        return routesJSs[url];
    };

    export const insertJS = (url: string, jsCode: string, external?: boolean): void => {
        let jsHtmlBody = external !== undefined ?
            `(function(){window.${navimiLoaderNS}.${callBackNS}("${url}", ${external}, (function(){return ${jsCode}   
            })())}())` : jsCode;

        __Navimi_Dom.insertJS(jsHtmlBody, url);
    };

    export const fetchJS = (abortController: AbortController, urls: string[], external?: boolean): Promise<InstanceType<any> | InstanceType<any>[]> => {

        const init = (url: string): Promise<InstanceType<any>> => {
            return new Promise<InstanceType<any>>(async (resolve, reject) => {

                // return the instance if this js is already loaded
                if (external && externalJSs[url]) {
                    return resolve(externalJSs[url]);
                } else {
                    if (routesJSs[url]) {
                        return resolve(routesJSs[url]);
                    }
                }

                // route repeated calls to an awaiter
                if (navimiLoader[promiseNS + url]) {
                    await awaitJS(url)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                // let the js resolve the promise itself (*1)
                navimiLoader[promiseNS + url] = resolve;
                navimiLoader[promiseNS + url + "_reject"] = reject;

                fetch(abortController, url, external).catch(ex => {
                    navimiLoader[promiseNS + url + "_reject"](ex);
                });
            });
        }

        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    export const loadServices = (abortController: AbortController, jsUrl: string, services: string[]): void => {

        if (!jsUrl || !services || services.length === 0) { 
            return;
        }

        routesJSsServices[jsUrl] = routesJSsServices[jsUrl] || [];

        if (services && services.length > 0) {
            let notFoundServices: string[] = [];
            const servicesUrls = services.map(sn => {
                const su: string = options.services && options.services[sn];
                if (su === undefined) {
                    notFoundServices.push(sn);
                } else {
                    routesJSsServices[jsUrl].indexOf(sn) === -1 && routesJSsServices[jsUrl].push(sn);
                    externalJSsMap[su] = {
                        ...externalJSsMap[su] || {},
                        [jsUrl]: true
                    };
                }
                return su;
            });

            if (notFoundServices.length > 0) {
                throw new Error("Service(s) not defined: " + notFoundServices.join(", "));
            }

            Promise.all(servicesUrls.filter(su => su !== undefined)
                .map(su => fetchJS(abortController, [su], true)));
        }

    };

    export const initJS = async (jsUrl: string, params: { [key: string]: any }): Promise<void> => {

        const jsInstance = getInstance(jsUrl);

        jsInstance && jsInstance.init &&
            await jsInstance.init(params);

    };

}