namespace __Navimi_JSs {

    let loadedJSs: { [url: string]: boolean } = {};
    let externalJSs: { [url: string]: InstanceType<any> } = {};
    let routesJSs: { [url: string]: InstanceType<any> } = {};
    let externalJSsMap: { [url: string]: { [url: string]: boolean } } = {};
    let routesJSsServices: { [url: string]: string[] } = {};
    let navigateTo: (url: string, params?: { [key: string]: any }) => void;
    let pagesNamespace: string, pagesMainCallBack: string;
    let options: Options;
    

    export const init = (config: any): void => {
        pagesNamespace = config.pagesNamespace;
        pagesMainCallBack = config.pagesMainCallBack;
        navigateTo = config.navigateTo;
        options = config.options;
        // @ts-ignore
        window[pagesNamespace] = {}; // initialize JS loader namespace

        // @ts-ignore
        const pages: any = window[pagesNamespace];

        // initialize JS loader callback namespace
        if (!pages[pagesMainCallBack]) {
            // create the function to be called from the injected js
            pages[pagesMainCallBack] = instantiateJS;
        }

    };

    const awaitJS = (jsUrl: string) => {
        const pages: any = window[pagesNamespace as any];

        return new Promise<InstanceType<any>>((resolve, reject) => {

            const loadInterval = setInterval(() => {
                if (routesJSs[jsUrl]) {
                    clearInterval(loadInterval);
                    return resolve(routesJSs[jsUrl]);
                }
                if (pages["_callback_" + jsUrl] === undefined) {
                    clearInterval(loadInterval);
                    return reject(`Error loading file! ${jsUrl}`);
                }
            }, 50);

        });
    };

    const fetch = (abortController: AbortController, url: string, external?: boolean): Promise<void | void[]> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const jsCode = await __Navimi_Fetch.fetchFile(url, {
                    headers: {
                        Accept: "application/javascript"
                    },
                    signal: abortController ? abortController.signal : undefined
                });

                loadedJSs[url] = true;

                let jsHtmlBody = external !== undefined ?
                `(function(){window.${pagesNamespace}.${pagesMainCallBack}("${url}", ${external}, (function(){return ${jsCode}   
                })())}())` : jsCode;

                __Navimi_Dom.insertJS(jsHtmlBody, url);

                if (external === undefined) {
                    // @ts-ignore
                    const pages: any = window[pagesNamespace];
                    pages["_callback_" + url](true);
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

        // @ts-ignore
        const pages: any = window[pagesNamespace];

        //remove callbacks
        setTimeout(() => {
            delete pages["_callback_" + jsUrl];
            delete pages["_callback_" + jsUrl + "_reject"];
        }, 1000);

        if (external) {
            //keep this instance to reuse later
            externalJSs[jsUrl] = JsClass;
            pages["_callback_" + jsUrl](Object.freeze(JsClass));
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
                    // urls.map((u: string) => { //todo: check if this is needed
                    //     this.externalTemplatesMap[u] = {
                    //         ...this.externalTemplatesMap[u] || {},
                    //         [jsUrl]: true
                    //     };
                    // });
                    return __Navimi_Templates.fetchTemplate(undefined, urls);
                },
                setState: __Navimi_State.setState,
                getState: __Navimi_State.getState,
                setNavimiLinks: () => __Navimi_Dom.setNavimiLinks(navigateTo),
                unwatchState: (key: string) => __Navimi_State.unwatchState(jsUrl, key),
                watchState: (key: string, callback: (state: any) => void) =>
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
            pages["_callback_" + jsUrl](jsInstance);

        } catch (error) {
            pages["_callback_" + jsUrl + "_reject"](error);

        }

    };

    export const isJsLoaded = (url: string): boolean => {
        return loadedJSs[url] !== undefined;
    };

    export const getInstance = (url: string): InstanceType<any> => {
        return routesJSs[url];
    };

    export const fetchJS = (abortController: AbortController, urls: string[], external?: boolean): Promise<InstanceType<any> | InstanceType<any>[]> => {
        // @ts-ignore
        const pages: any = window[pagesNamespace];
        const init = (url: string): Promise<InstanceType<any>> => {
            return new Promise<InstanceType<any>>(async (resolve, reject) => {
                // return the instance if this js is already loaded
                if (external) {
                    if (externalJSs[url]) {
                        return resolve(externalJSs[url]);
                    }
                } else {
                    if (routesJSs[url]) {
                        return resolve(routesJSs[url]);
                    }
                }

                // route repeated calls to an awaiter
                if (pages["_callback_" + url]) {
                    await awaitJS(url)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                // let the js resolve the promise itself (*1)
                pages["_callback_" + url] = resolve;
                pages["_callback_" + url + "_reject"] = reject;

                fetch(abortController, url, external).catch(ex => {
                    delete pages["_callback_" + url];
                    pages["_callback_" + url + "_reject"](ex);
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

    export const initJS = async (jsUrl: string, params: any ): Promise<void> => {

        const jsInstance = getInstance(jsUrl);

        jsInstance && jsInstance.init &&
            await jsInstance.init(params);

    };

}