class __Navimi_JSs implements INavimi_JSs {

    private _navimiLoaderNS: string = "__navimiLoader";
    private _callBackNS: string = "_jsLoaderCallback";
    private _promiseNS: string = "_promise_";

    private _loadedJSs: INavimi_KeyList<boolean | string> = {};
    private _externalJSs: INavimi_KeyList<InstanceType<any>> = {};
    private _routesJSs: INavimi_KeyList<InstanceType<any>> = {};
    private _dependencyJSsMap: INavimi_KeyList<INavimi_KeyList<boolean>> = {};
    private _routesJSsServices: INavimi_KeyList<string[]> = {};

    private _navimiLoader: any;
    private _options: INavimi_Options;

    private _navimiDom: INavimi_Dom;
    private _navimiFetch: INavimi_Fetch;
    private _navimiTemplates: INavimi_Templates;
    private _navimiState: INavimi_State;

    public init(navimiDom: INavimi_Dom, navimiFetch: INavimi_Fetch, navimiTemplates: INavimi_Templates, navimiState: INavimi_State, options: INavimi_Options) {

        this._navimiDom = navimiDom;
        this._navimiFetch = navimiFetch;
        this._navimiTemplates = navimiTemplates;
        this._navimiState = navimiState;

        this._options = options;

        // @ts-ignore
        this._navimiLoader = window[this._navimiLoaderNS] = {
            [this._callBackNS]: this._instantiateJS, // initialize JS loader namespace
        };

    }

    private _awaitJS = (jsUrl: string) => {
        return new Promise<InstanceType<any>>((resolve, reject) => {

            const loadInterval = setInterval(() => {
                if (this._routesJSs[jsUrl]) {
                    clearInterval(loadInterval);
                    return resolve(this._routesJSs[jsUrl]);
                }
                if (this._navimiLoader[this._promiseNS + jsUrl] === undefined) {
                    clearInterval(loadInterval);
                    return reject(`Error loading file! ${jsUrl}`);
                }
            }, 50);

        });
    };

    private _fetch = (abortController: AbortController, url: string, external?: boolean): Promise<void | void[]> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let jsCode: string;
                if (typeof this._loadedJSs[url] === "string") {
                    jsCode = this._loadedJSs[url] as string;
                } else {
                    jsCode = await this._navimiFetch.fetchFile(url, {
                        headers: {
                            Accept: "application/javascript"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });

                }

                this._insertJS(url, jsCode, external);

                if (external === undefined) {
                    this._navimiLoader[this._promiseNS + url](true); // resolve the promise - script is loaded
                }

                resolve();

            } catch (ex) {
                reject(ex);
            }
        });
    };

    private _insertJS = (url: string, jsCode: string, external?: boolean): void => {
        let jsHtmlBody = external !== undefined ?
            `(function(){window.${this._navimiLoaderNS}.${this._callBackNS}("${url}", ${external}, (function(){return ${jsCode}   
                })())}())` : jsCode;

        this._loadedJSs[url] = external ? true : jsCode;
        this._navimiDom.insertJS(jsHtmlBody, url);
    };

    private _instantiateJS = async (
        jsUrl: string,
        external: boolean, //todo: change to isRouteScript
        JsClass: InstanceType<any>): Promise<void> => {

        const promiseToResolve: any = this._navimiLoader[this._promiseNS + jsUrl];
        const promiseToReject: any = this._navimiLoader[this._promiseNS + jsUrl + "_reject"];

        // remove callbacks
        setTimeout(() => {
            delete this._navimiLoader[this._promiseNS + jsUrl];
            delete this._navimiLoader[this._promiseNS + jsUrl + "_reject"];
        }, 10);

        if (external) {
            // keep this instance to reuse later
            this._externalJSs[jsUrl] = JsClass;
            promiseToResolve && promiseToResolve(Object.freeze(JsClass));
            return;
        }

        try {
            this._navimiState.unwatchState(jsUrl);

            const routerFunctions: INavimi_RouterFunctions = {
                addLibrary: this._navimiDom.addLibrary,
                setTitle: this._navimiDom.setTitle,
                navigateTo: (window as any).navigateTo,
                getTemplate: this._navimiTemplates.getTemplate,
                fetchJS: (url: string | string[]) => {
                    const urls = Array.isArray(url) ? url : [url];
                    urls.map(u => {
                        this._dependencyJSsMap[u] = {
                            ...this._dependencyJSsMap[u] || {},
                            [jsUrl]: true
                        };
                    });
                    return this.fetchJS(undefined, urls, true);
                },
                fetchTemplate: (url: string) => {
                    const urls: string[] = Array.isArray(url) ? url : [url];
                    return this._navimiTemplates.fetchTemplate(undefined, urls, jsUrl);
                },
                setState: this._navimiState.setState,
                getState: this._navimiState.getState,
                setNavimiLinks: this._navimiDom.setNavimiLinks,
                unwatchState: (key: string) => this._navimiState.unwatchState(jsUrl, key),
                watchState: (key: string, callback: (state: INavimi_KeyList<any>) => void) =>
                    this._navimiState.watchState(jsUrl, key, callback),
            };

            let services: INavimi_KeyList<InstanceType<any>> = {};

            if (this._routesJSsServices[jsUrl] && this._routesJSsServices[jsUrl].length > 0) {
                while (true) {
                    if (this._routesJSsServices[jsUrl].map((sn: string) =>
                        this._externalJSs[this._options.services[sn]] === undefined).indexOf(true) === -1) {
                        break;
                    }
                    if (this._routesJSsServices[jsUrl].map(sn =>
                        this._options.services[sn]).find(su => this._navimiFetch.getErrors(su))) {
                        return;
                    }
                    await __Navimi_Helpers.timeout(10);
                }

                this._routesJSsServices[jsUrl].map((sn: string) => {
                    services = {
                        ...services,
                        [sn]: this._externalJSs[this._options.services[sn]]
                    };
                });
            }

            let jsInstance = new JsClass(Object.freeze(routerFunctions), services);

            //keep this instance to reuse later
            this._routesJSs[jsUrl] = jsInstance;
            promiseToResolve && promiseToResolve(jsInstance);

        } catch (error) {
            promiseToReject && promiseToReject(error);

        }

    };

    public isJsLoaded = (url: string): boolean => {
        return this._loadedJSs[url] !== undefined;
    };

    public getInstance = (url: string): InstanceType<any> => {
        return this._routesJSs[url];
    };

    public fetchJS = (abortController: AbortController, urls: string[], external?: boolean): Promise<InstanceType<any> | InstanceType<any>[]> => {

        const init = (url: string): Promise<InstanceType<any>> => {
            return new Promise<InstanceType<any>>(async (resolve, reject) => {

                // return the instance if this js is already loaded
                if (external && this._externalJSs[url]) {
                    return resolve(this._externalJSs[url]);
                } else {
                    if (this._routesJSs[url]) {
                        return resolve(this._routesJSs[url]);
                    }
                }

                // route repeated calls to an awaiter
                if (this._navimiLoader[this._promiseNS + url]) {
                    await this._awaitJS(url)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                // let the js resolve the promise itself (*1)
                this._navimiLoader[this._promiseNS + url] = resolve;
                this._navimiLoader[this._promiseNS + url + "_reject"] = reject;

                this._fetch(abortController, url, external).catch(ex => {
                    this._navimiLoader[this._promiseNS + url + "_reject"](ex);
                });
            });
        }

        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    public loadServices = (abortController: AbortController, jsUrl: string, services: string[]): void => {

        if (!jsUrl || !services || services.length === 0) {
            return;
        }

        this._routesJSsServices[jsUrl] = this._routesJSsServices[jsUrl] || [];

        if (services && services.length > 0) {
            let notFoundServices: string[] = [];
            const servicesUrls = services.map(sn => {
                const su: string = this._options.services && this._options.services[sn];
                if (su === undefined) {
                    notFoundServices.push(sn);
                } else {
                    this._routesJSsServices[jsUrl].indexOf(sn) === -1 && this._routesJSsServices[jsUrl].push(sn);
                    this._dependencyJSsMap[su] = {
                        ...this._dependencyJSsMap[su] || {},
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

    public initJS = async (jsUrl: string, params: INavimi_KeyList<any>): Promise<void> => {

        const jsInstance = this.getInstance(jsUrl);

        jsInstance && jsInstance.init &&
            await jsInstance.init(params);

    };

    public reloadJs = (filePath: string,
        jsCode: string,
        routeList: INavimi_KeyList<INavimi_Route>,
        currentJS: string,
        callback: any): void => {

        const isSameFile = __Navimi_Helpers.isSameFile;

        for (const routeUrl in routeList) {
            const { jsUrl } = routeList[routeUrl];

            if (isSameFile(jsUrl, filePath)) {

                console.log(`${filePath} updated.`);

                delete this._routesJSs[jsUrl];

                this._navimiLoader[this._promiseNS + jsUrl] = () => {
                    if (jsUrl === currentJS) {
                        //reload route if current JS is updated
                        callback();
                    }
                };

                this._insertJS(jsUrl, jsCode, false);

                return;
            }
        }

        for (const jsUrl in this._dependencyJSsMap) {
            if (isSameFile(jsUrl, filePath)) {
                console.log(`${filePath} updated.`);

                delete this._externalJSs[jsUrl];

                this._navimiLoader[this._promiseNS + jsUrl] = () => {
                    Object.keys(this._dependencyJSsMap[jsUrl]).map(s => {
                        //clear all dependent JSs that depends of this JS
                        delete this._routesJSs[s];

                        if (s === currentJS) {
                            //reload route if current JS is updated
                            callback();
                        }
                    });
                };

                this._insertJS(filePath, jsCode, true);
            }
        }
    };

}