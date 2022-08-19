class __Navimi_JSs implements INavimi_JSs {

    private _navimiLoaderNS: string = "__navimiLoader";
    private _callBackNS: string = "_jsLoaderCallback";
    private _promiseNS: string = "_promise_";

    private _loadedJSs: INavimi_KeyList<string> = {};
    private _jsType: INavimi_KeyList<jsType> = {};
    private _jsInstances: INavimi_KeyList<InstanceType<any>> = {};
    private _dependencyJSsMap: INavimi_KeyList<INavimi_KeyList<boolean>> = {};
    private _routesJSsServices: INavimi_KeyList<string[]> = {};
    private _routesJSsComponents: INavimi_KeyList<string[]> = {};

    private _navimiLoader: any;
    private _options: INavimi_Options;

    private _navimiDom: INavimi_Dom;
    private _navimiFetch: INavimi_Fetch;
    private _navimiTemplates: INavimi_Templates;
    private _navimiState: INavimi_State;
    private _navimiComponents: INavimi_Components;

    public init(
        navimiDom: INavimi_Dom,
        navimiFetch: INavimi_Fetch,
        navimiTemplates: INavimi_Templates,
        navimiState: INavimi_State,
        navimiComponents: INavimi_Components,
        options: INavimi_Options
    ) {

        this._navimiDom = navimiDom;
        this._navimiFetch = navimiFetch;
        this._navimiTemplates = navimiTemplates;
        this._navimiState = navimiState;
        this._navimiComponents = navimiComponents;

        this._options = options;

        // @ts-ignore
        this._navimiLoader = window[this._navimiLoaderNS] = {
            [this._callBackNS]: this._instantiateJS, // initialize JS loader namespace
        };

    }

    private _resolvePromise = (value: unknown, jsUrl: string): void => {
        this._navimiLoader[this._promiseNS + jsUrl](value);
    };

    private _rejectPromise = (reason: any, jsUrl: string): void => {
        this._navimiLoader[this._promiseNS + jsUrl + "_reject"](reason);
    };

    private _awaitJS = (jsUrl: string) => {
        return new Promise<InstanceType<any>>((resolve, reject) => {

            const loadInterval = setInterval(() => {
                if (this._jsInstances[jsUrl]) {
                    clearInterval(loadInterval);
                    return resolve(this._jsInstances[jsUrl]);
                }
                const error = this._navimiFetch.getErrors(jsUrl);
                if (error) {
                    clearInterval(loadInterval);
                    return reject(error);
                }
            }, 10);

        });
    };

    private _fetch = (abortController: AbortController, url: string, type: jsType): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let jsCode: string;
                if (this._loadedJSs[url]) {
                    jsCode = this._loadedJSs[url];
                } else {
                    jsCode = await this._navimiFetch.fetchFile(url, {
                        headers: {
                            Accept: "application/javascript"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });
                }

                this._jsType[url] = type;
                this._insertJS(url, jsCode, type);

                if (type !== "route" && type !== "service") { // todo: get the correct types to use here
                    this._resolvePromise(true, url); // resolve the promise - script is loaded
                }

                resolve();

            } catch (ex) {
                reject(ex);
            }
        });
    };

    private _insertJS = (url: string, jsCode: string, type: jsType): void => {
        let jsHtmlBody = (type === "module" || type === "library") ? jsCode :
            `(function(){window.${this._navimiLoaderNS}.${this._callBackNS}("${url}", "${type}", (function(){return ${jsCode}   
                })())}())`;

        this._loadedJSs[url] = jsCode;
        this._navimiDom.insertJS(jsHtmlBody, url, type === "module");
    };

    private _instantiateJS = async (
        jsUrl: string,
        type: jsType,
        JsClass: InstanceType<any>): Promise<void> => {

        // remove callbacks
        setTimeout(() => {
            delete this._navimiLoader[this._promiseNS + jsUrl];
            delete this._navimiLoader[this._promiseNS + jsUrl + "_reject"];
        }, 10);

        if (type !== "route") {
            // keep this instance to reuse later
            this._jsInstances[jsUrl] = JsClass;
            this._resolvePromise(Object.freeze(JsClass), jsUrl);
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
                    return this.fetchJS(undefined, urls, "javascript");
                },
                fetchTemplate: (url: string | string[]) => {
                    return this._navimiTemplates.fetchTemplate(undefined, url);
                },
                setState: this._navimiState.setState,
                getState: this._navimiState.getState,
                setNavimiLinks: this._navimiDom.setNavimiLinks,
                unwatchState: (key: string) => this._navimiState.unwatchState(jsUrl, key),
                watchState: (key: string, callback: (state: INavimi_KeyList<any>) => void) =>
                    this._navimiState.watchState(jsUrl, key, callback),
            };

            let services: INavimi_KeyList<InstanceType<any>> = {};

            //gather all services
            this._routesJSsServices[jsUrl].map((sn: string) => {
                services = {
                    ...services,
                    [sn]: this._jsInstances[this._options.services[sn]]
                };
            });

            let jsInstance = new JsClass(Object.freeze(routerFunctions), services);

            //keep this instance to reuse later
            this._jsInstances[jsUrl] = jsInstance;
            this._resolvePromise(jsInstance, jsUrl);

        } catch (error) {
            this._rejectPromise(error, jsUrl);

        }

    };

    private _isJsLoading = (jsUrl: string): boolean => {
        return this._navimiLoader[this._promiseNS + jsUrl] !== undefined;
    };

    public isJsLoaded = (url: string): boolean => {
        return this._loadedJSs[url] !== undefined;
    };

    public getInstance = (url: string): InstanceType<any> => {
        return this._jsInstances[url];
    };

    public fetchJS = (abortController: AbortController, urls: string[], type: jsType): Promise<InstanceType<any> | InstanceType<any>[]> => {

        const init = (url: string): Promise<InstanceType<any>> => {
            return new Promise<InstanceType<any>>(async (resolve, reject) => {

                // return the instance if this js is already loaded
                if (this._jsInstances[url]) {
                    return resolve(this._jsInstances[url]);
                }

                // route repeated calls to an awaiter
                if (this._isJsLoading(url)) {
                    await this._awaitJS(url)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                // let the js resolve the promise itself when it loads (in _instantiateJS)
                this._navimiLoader[this._promiseNS + url] = resolve;
                this._navimiLoader[this._promiseNS + url + "_reject"] = reject;

                this._fetch(abortController, url, type).catch(reject);
            });
        }

        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    public loadDependencies = async (abortController: AbortController, jsUrl: string, services: string[], components: string[]): Promise<void> => {

        if (!jsUrl) {
            return;
        }

        const checkUrls = (depArray: string[], type: "services" | "components"): string[] => {
            const notFound: string[] = [];
            const urls = (depArray || []).map(name => {
                //@ts-ignore
                const url: string = this._options[type] && this._options[type][name];
                if (url === undefined) {
                    notFound.push(name);
                } else {
                    type === "services" &&
                        this._routesJSsServices[jsUrl].indexOf(name) === -1 && 
                        this._routesJSsServices[jsUrl].push(name);

                    type === "components" &&
                        this._routesJSsComponents[jsUrl].indexOf(name) === -1 && 
                        this._routesJSsComponents[jsUrl].push(name);

                    this._dependencyJSsMap[url] = {
                        ...this._dependencyJSsMap[url] || {},
                        [jsUrl]: true
                    };
                }
                return url;
            });

            if (notFound.length > 0) {
                throw new Error(type + " not defined: " + notFound.join(", "));
            }

            return urls;
        }

        this._routesJSsServices[jsUrl] = this._routesJSsServices[jsUrl] || [];
        this._routesJSsComponents[jsUrl] = this._routesJSsComponents[jsUrl] || [];

        const servicesUrls = checkUrls(services, "services");
        const componentsUrls = checkUrls(components, "components");

        Promise.all(servicesUrls.filter(url => url !== undefined)
            .map(url => this.fetchJS(abortController, [url], "service")));

        Promise.all(componentsUrls.filter(url => url !== undefined)
            .map(url =>
                this
                    .fetchJS(abortController, [url], "component")
                    .then((componentClass: InstanceType<any>) => {

                        //register components as soon as they are loaded
                        Object.keys(this._options.components).map((name: string) => {
                            if (this._options.components[name] === url) {
                                this._navimiComponents.registerComponent(name, componentClass);
                            }
                        });

                    })
            ));

        // wait for all dependencies to be loaded
        await Promise.all(servicesUrls.map(this._awaitJS));
        await Promise.all(componentsUrls.map(this._awaitJS));

        return;
    };

    public initJS = async (jsUrl: string, params: INavimi_KeyList<any>): Promise<void> => {

        const jsInstance = this.getInstance(jsUrl);

        jsInstance && jsInstance.init &&
            await jsInstance.init(params);

    };

    //removeIf(minify)
    public digestHot = ({filePath, data}: hotPayload): Promise<void> => {

        if (!this.isJsLoaded(filePath)) {
            return;
        }

        return Promise.resolve();

        //discover the js type
        // "module"
        // "library"

        // "route"
        // "javascript"
        // "service"
        // "component"

        //call destroy and unload for all js that are referencing this js

        //remove the js from the loaded js list
        //load the js again
        //callback
        

        // private _routesJSs: INavimi_KeyList<InstanceType<any>> = {};
        // private _dependencyJSsMap: INavimi_KeyList<INavimi_KeyList<boolean>> = {};
        // private _routesJSsServices: INavimi_KeyList<string[]> = {};
        // private _routesJSsComponents: INavimi_KeyList<string[]> = {};


        // for (const routeUrl in routeList) {
        //     const { jsUrl } = routeList[routeUrl];

        //     if (isSameFile(jsUrl, filePath)) {

        //         console.log(`${filePath} updated.`);

        //         delete this._routesJSs[jsUrl];

        //         this._navimiLoader[this._promiseNS + jsUrl] = () => {
        //             if (jsUrl === currentJS) {
        //                 //reload route if current JS is updated
        //                 callback();
        //             }
        //         };

        //         this._insertJS(jsUrl, jsCode, "route");

        //         return;
        //     }
        // }

        // for (const jsUrl in this._dependencyJSsMap) {
        //     if (isSameFile(jsUrl, filePath)) {
        //         console.log(`${filePath} updated.`);

        //         this._navimiLoader[this._promiseNS + jsUrl] = () => {
        //             Object.keys(this._dependencyJSsMap[jsUrl]).map(s => {
        //                 //clear all dependent JSs that depends of this JS
        //                 delete this._routesJSs[s];

        //                 if (s === currentJS) {
        //                     //reload route if current JS is updated
        //                     callback();
        //                 }
        //             });
        //         };

        //         //todo: check for modules, services and components
        //         this._insertJS(filePath, jsCode, "javascript");
        //     }
        // }
        
    };
    //endRemoveIf(minify)
}


//removeIf(dist)
module.exports.jss = __Navimi_JSs
//endRemoveIf(dist)
