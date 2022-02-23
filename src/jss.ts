namespace __Navimi {

    export class Navimi_JSs {

        private navimiLoaderNS: string = "__navimiLoader";
        private callBackNS: string = "_jsLoaderCallback";
        private promiseNS: string = "_promise_";

        private loadedJSs: KeyList<boolean | string> = {};
        private externalJSs: KeyList<InstanceType<any>> = {};
        private routesJSs: KeyList<InstanceType<any>> = {};
        private dependencyJSsMap: KeyList<KeyList<boolean>> = {};
        private routesJSsServices: KeyList<string[]> = {};

        private navimiLoader: any;
        private options: Options;

        private domFunctions: any = {};
        private navimiFetch: any = {};
        private navimiTemplates: any = {};
        private navimiState: any;

        public init(_domFunctions: any, _navimiFetch: any, _navimiTemplates: any, _navimiState: any, _options: Options) {

            this.domFunctions = _domFunctions;
            this.navimiFetch = _navimiFetch;
            this.navimiTemplates = _navimiTemplates;
            this.navimiState = _navimiState;

            this.options = _options;

            // @ts-ignore
            this.navimiLoader = window[this.navimiLoaderNS] = {
                [this.callBackNS]: this.instantiateJS, // initialize JS loader namespace
            };

        }

        private awaitJS = (jsUrl: string) => {
            return new Promise<InstanceType<any>>((resolve, reject) => {

                const loadInterval = setInterval(() => {
                    if (this.routesJSs[jsUrl]) {
                        clearInterval(loadInterval);
                        return resolve(this.routesJSs[jsUrl]);
                    }
                    if (this.navimiLoader[this.promiseNS + jsUrl] === undefined) {
                        clearInterval(loadInterval);
                        return reject(`Error loading file! ${jsUrl}`);
                    }
                }, 50);

            });
        };

        private fetch = (abortController: AbortController, url: string, external?: boolean): Promise<void | void[]> => {
            return new Promise<void>(async (resolve, reject) => {
                try {
                    let jsCode: string;
                    if (typeof this.loadedJSs[url] === "string") {
                        jsCode = this.loadedJSs[url] as string;
                    } else {
                        jsCode = await this.navimiFetch.fetchFile(url, {
                            headers: {
                                Accept: "application/javascript"
                            },
                            signal: abortController ? abortController.signal : undefined
                        });

                    }

                    this.insertJS(url, jsCode, external);

                    if (external === undefined) {
                        this.navimiLoader[this.promiseNS + url](true); // resolve the promise - script is loaded
                    }

                    resolve();

                } catch (ex) {
                    reject(ex);
                }
            });
        };

        private insertJS = (url: string, jsCode: string, external?: boolean): void => {
            let jsHtmlBody = external !== undefined ?
                `(function(){window.${this.navimiLoaderNS}.${this.callBackNS}("${url}", ${external}, (function(){return ${jsCode}   
                })())}())` : jsCode;

            this.loadedJSs[url] = external ? true : jsCode;
            this.domFunctions.insertJS(jsHtmlBody, url);
        };

        private instantiateJS = async (
            jsUrl: string,
            external: boolean, //todo: change to isRouteScript
            JsClass: InstanceType<any>): Promise<void> => {

            const promiseToResolve: any = this.navimiLoader[this.promiseNS + jsUrl];
            const promiseToReject: any = this.navimiLoader[this.promiseNS + jsUrl + "_reject"];

            // remove callbacks
            setTimeout(() => {
                delete this.navimiLoader[this.promiseNS + jsUrl];
                delete this.navimiLoader[this.promiseNS + jsUrl + "_reject"];
            }, 10);

            if (external) {
                // keep this instance to reuse later
                this.externalJSs[jsUrl] = JsClass;
                promiseToResolve && promiseToResolve(Object.freeze(JsClass));
                return;
            }

            try {
                this.navimiState.unwatchState(jsUrl);

                const routerFunctions = Object.freeze({
                    addLibrary: this.domFunctions.addLibrary,
                    setTitle: this.domFunctions.setTitle,
                    navigateTo: (window as any).navigateTo,
                    getTemplate: this.navimiTemplates.getTemplate,
                    fetchJS: (url: string | string[]) => {
                        const urls = Array.isArray(url) ? url : [url];
                        urls.map(u => {
                            this.dependencyJSsMap[u] = {
                                ...this.dependencyJSsMap[u] || {},
                                [jsUrl]: true
                            };
                        });
                        return this.fetchJS(undefined, urls, true);
                    },
                    fetchTemplate: (url: string) => {
                        const urls: string[] = Array.isArray(url) ? url : [url];
                        return this.navimiTemplates.fetchTemplate(undefined, urls, jsUrl);
                    },
                    setState: this.navimiState.setState,
                    getState: this.navimiState.getState,
                    setNavimiLinks: this.domFunctions.setNavimiLinks,
                    unwatchState: (key: string) => this.navimiState.unwatchState(jsUrl, key),
                    watchState: (key: string, callback: (state: KeyList<any>) => void) =>
                        this.navimiState.watchState(jsUrl, key, callback),
                });

                let services: { [serviceName: string]: InstanceType<any> };

                if (this.routesJSsServices[jsUrl] && this.routesJSsServices[jsUrl].length > 0) {
                    while (true) {
                        if (this.routesJSsServices[jsUrl].map((sn: string) =>
                            this.externalJSs[this.options.services[sn]] === undefined).indexOf(true) === -1) {
                            break;
                        }
                        if (this.routesJSsServices[jsUrl].map(sn =>
                            this.options.services[sn]).find(su => this.navimiFetch.loadErrors[su])) {
                            return;
                        }
                        await __Navimi_Helpers.timeout(10);
                    }

                    this.routesJSsServices[jsUrl].map((sn: string) => {
                        services = {
                            ...services,
                            [sn]: this.externalJSs[this.options.services[sn]]
                        };
                    });
                }

                let jsInstance = new JsClass(routerFunctions, services);

                //keep this instance to reuse later
                this.routesJSs[jsUrl] = jsInstance;
                promiseToResolve && promiseToResolve(jsInstance);

            } catch (error) {
                promiseToReject && promiseToReject(error);

            }

        };

        public isJsLoaded = (url: string): boolean => {
            return this.loadedJSs[url] !== undefined;
        };

        public getInstance = (url: string): InstanceType<any> => {
            return this.routesJSs[url];
        };

        public fetchJS = (abortController: AbortController, urls: string[], external?: boolean): Promise<InstanceType<any> | InstanceType<any>[]> => {

            const init = (url: string): Promise<InstanceType<any>> => {
                return new Promise<InstanceType<any>>(async (resolve, reject) => {

                    // return the instance if this js is already loaded
                    if (external && this.externalJSs[url]) {
                        return resolve(this.externalJSs[url]);
                    } else {
                        if (this.routesJSs[url]) {
                            return resolve(this.routesJSs[url]);
                        }
                    }

                    // route repeated calls to an awaiter
                    if (this.navimiLoader[this.promiseNS + url]) {
                        await this.awaitJS(url)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    // let the js resolve the promise itself (*1)
                    this.navimiLoader[this.promiseNS + url] = resolve;
                    this.navimiLoader[this.promiseNS + url + "_reject"] = reject;

                    this.fetch(abortController, url, external).catch(ex => {
                        this.navimiLoader[this.promiseNS + url + "_reject"](ex);
                    });
                });
            }

            return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
        };

        public loadServices = (abortController: AbortController, jsUrl: string, services: string[]): void => {

            if (!jsUrl || !services || services.length === 0) {
                return;
            }

            this.routesJSsServices[jsUrl] = this.routesJSsServices[jsUrl] || [];

            if (services && services.length > 0) {
                let notFoundServices: string[] = [];
                const servicesUrls = services.map(sn => {
                    const su: string = this.options.services && this.options.services[sn];
                    if (su === undefined) {
                        notFoundServices.push(sn);
                    } else {
                        this.routesJSsServices[jsUrl].indexOf(sn) === -1 && this.routesJSsServices[jsUrl].push(sn);
                        this.dependencyJSsMap[su] = {
                            ...this.dependencyJSsMap[su] || {},
                            [jsUrl]: true
                        };
                    }
                    return su;
                });

                if (notFoundServices.length > 0) {
                    throw new Error("Service(s) not defined: " + notFoundServices.join(", "));
                }

                Promise.all(servicesUrls.filter(su => su !== undefined)
                    .map(su => this.fetchJS(abortController, [su], true)));
            }

        };

        public initJS = async (jsUrl: string, params: KeyList<any>): Promise<void> => {

            const jsInstance = this.getInstance(jsUrl);

            jsInstance && jsInstance.init &&
                await jsInstance.init(params);

        };

        public reloadJs = (filePath: string,
            jsCode: string,
            routeList: KeyList<Route>,
            currentJS: string,
            callback: any): void => {

            const isSameFile = __Navimi_Helpers.isSameFile;

            for (const routeUrl in routeList) {
                const { jsUrl } = routeList[routeUrl];

                if (isSameFile(jsUrl, filePath)) {

                    console.log(`${filePath} updated.`);

                    delete this.routesJSs[jsUrl];

                    this.navimiLoader[this.promiseNS + jsUrl] = () => {
                        if (jsUrl === currentJS) {
                            //reload route if current JS is updated
                            callback();
                        }
                    };

                    this.insertJS(jsUrl, jsCode, false);

                    return;
                }
            }

            for (const jsUrl in this.dependencyJSsMap) {
                if (isSameFile(jsUrl, filePath)) {
                    console.log(`${filePath} updated.`);

                    delete this.externalJSs[jsUrl];

                    this.navimiLoader[this.promiseNS + jsUrl] = () => {
                        Object.keys(this.dependencyJSsMap[jsUrl]).map(s => {
                            //clear all dependent JSs that depends of this JS
                            delete this.routesJSs[s];

                            if (s === currentJS) {
                                //reload route if current JS is updated
                                callback();
                            }
                        });
                    };

                    this.insertJS(filePath, jsCode, true);
                }
            }
        };

    }


}