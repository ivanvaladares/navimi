class __Navimi_JSs implements INavimi_JSs {

    private _navimiLoaderNS = "__navimiLoader";
    private _callBackNS = "_jsLoaderCallback";
    private _promiseNS = "_promise_";

    private _loadedJSs: INavimi_KeyList<string> = {};
    private _jsType: INavimi_KeyList<jsType> = {};
    private _jsInstances: INavimi_KeyList<InstanceType<any>> = {};
    private _dependencyJSsMap: INavimi_KeyList<INavimi_KeyList<boolean>> = {};
    private _routesJSsServices: INavimi_KeyList<string[]> = {};
    private _routesJSsComponents: INavimi_KeyList<string[]> = {};

    private _navimiLoader: any;
    private _options: INavimi_Options;

    private _navimiHelpers: INavimi_Helpers;
    private _navimiFetch: INavimi_Fetch;
    private _navimiCSSs: INavimi_CSSs;
    private _navimiTemplates: INavimi_Templates;
    private _navimiState: INavimi_State;
    private _navimiComponents: INavimi_Components;

    public init(
        navimiHelpers: INavimi_Helpers,
        navimiFetch: INavimi_Fetch,
        navimiCSSs: INavimi_CSSs,
        navimiTemplates: INavimi_Templates,
        navimiState: INavimi_State,
        navimiComponents: INavimi_Components,
        options: INavimi_Options
    ) {

        this._navimiHelpers = navimiHelpers;
        this._navimiFetch = navimiFetch;
        this._navimiCSSs = navimiCSSs;
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

                const type = this._jsType[jsUrl];
                if ((type === 'library' || type === 'module') && this.isJsLoaded(jsUrl)) {
                    clearInterval(loadInterval);
                    return resolve("");
                }
            
                const error = this._navimiFetch.getErrors(jsUrl);
                if (error) {
                    clearInterval(loadInterval);
                    return reject(error);
                }

            }, 10);

        });
    };

    private _addLibrary = async (library: string | string[] | INavimi_Library[]): Promise<void> => {

        const arr = Array.isArray(library) ? library : [library];

        if (arr.length > 0) {

            const libraries: INavimi_Library[] = arr.map(lib => {
                if (typeof lib === "string") {
                    const type = lib.split(".").pop();
                    return {
                        url: lib, 
                        type: type.toLowerCase(),
                    } as INavimi_Library;
                } else {
                    return lib as INavimi_Library;
                }
            });

            await Promise.all(libraries.map(obj => {
                const type = obj.type.toLowerCase();
                if (type === "css") {
                    return this._navimiCSSs.fetchCss(undefined, obj.url).then(() => {
                        this._navimiCSSs.insertCss(obj.url, 'library', true);
                    });
                } else {
                    return this.fetchJS(undefined, [obj.url], type === "module" ? "module" : "library");
                }
            })).catch(ex => {
                throw new Error(ex)
            });

        }
    };

    private _fetch = (abortController: AbortController, url: string, type: jsType): Promise<void> => {
        return this._navimiFetch.fetchFile(url, {
            headers: {
                Accept: "application/javascript"
            },
            signal: abortController ? abortController.signal : undefined
        }).then(jsCode => {
            this._jsType[url] = type;
            this._insertJS(url, jsCode, type);
        });
    };

    private _insertJS = (url: string, jsCode: string, type: jsType): void => {
        const jsHtmlBody = (type === "module" || type === "library") ? jsCode :
            `(function(){window.${this._navimiLoaderNS}.${this._callBackNS}("${url}", "${type}", (function(){return ${jsCode}   
                })())}())`;

        this._loadedJSs[url] = jsCode;
       
        const oldTag = document.querySelector(`[jsUrl='${url}']`);
        if (oldTag) {
            oldTag.remove();
        }

        const script: HTMLScriptElement = document.createElement("script");
        script.type = type === "module" ? "module" : "text/javascript";
        script.innerHTML = jsHtmlBody;
        script.setAttribute("jsUrl", url);
        const head = document.getElementsByTagName("head")[0];
        (head || document.body).appendChild(script);
        
        if (type === 'module' || type === 'library') {
            this._resolvePromise(true, url); // resolve the promise - script is loaded
        }
    };

    private _instantiateJS = async (
        jsUrl: string,
        type: jsType,
        JsClass: InstanceType<any>): Promise<void> => {

        // for services, components and javascript
        if (type !== "route") {
            // keep this instance to reuse later
            this._jsInstances[jsUrl] = JsClass;
            this._resolvePromise(Object.freeze(JsClass), jsUrl);
            return;
        }

        try {
            this._navimiState.unwatchState(jsUrl);

            const routerFunctions: INavimi_RouterFunctions = {
                addLibrary: this._addLibrary,
                setTitle: this._navimiHelpers.setTitle,
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
                setNavimiLinks: this._navimiHelpers.setNavimiLinks,
                unwatchState: (key: string) => this._navimiState.unwatchState(jsUrl, key),
                watchState: (key: string, callback: (state: INavimi_KeyList<any>) => void) =>
                    this._navimiState.watchState(jsUrl, key, callback),
            };

            //wait for all dependencies to be loaded
            const dependencies = [];
            for (const deps in this._dependencyJSsMap) {
                if (this._dependencyJSsMap[deps][jsUrl]) {
                    dependencies.push(deps);
                }
            }
            await Promise.all(dependencies.map(this._awaitJS));

            //gather all services
            let services: INavimi_KeyList<InstanceType<any>> = {};
            this._routesJSsServices[jsUrl].map((sn: string) => {
                services = {
                    ...services,
                    [sn]: this._jsInstances[this._options.services[sn]]
                };
            });

            const jsInstance = new JsClass(Object.freeze(routerFunctions), services);

            //keep this instance to reuse later
            this._jsInstances[jsUrl] = jsInstance;
            this._resolvePromise(jsInstance, jsUrl);

        } catch (error) {
            this._rejectPromise(error, jsUrl);
        }

    };

    private _isJsLoading = (jsUrl: string): boolean => {
        return this._navimiLoader[this._promiseNS + jsUrl] !== undefined && 
            !this._navimiFetch.getErrors(jsUrl);
    };

    public isJsLoaded = (url: string): boolean => {
        return this._loadedJSs[url] !== undefined;
    };

    public getInstance = (url: string): InstanceType<any> => {
        return this._jsInstances[url];
    };

    public fetchJS = (abortController: AbortController, urls: string[], type: jsType): Promise<InstanceType<any> | InstanceType<any>[]> => {

        const init = (url: string): Promise<InstanceType<any>> => {
            return new Promise<InstanceType<any>>((resolve, reject) => {

                // return the instance if this js is already loaded
                if (this._jsInstances[url]) {
                    return resolve(this._jsInstances[url]);
                }

                // stop here if the module or library is already inserted
                if (this._loadedJSs[url] && (type === 'module' || type === 'library')) {
                    return resolve(true);
                }                        

                // route repeated calls to an awaiter
                if (this._isJsLoading(url)) {
                    return this._awaitJS(url)
                        .then(resolve)
                        .catch(reject);
                }

                // let the js resolve the promise itself when it loads (in _instantiateJS)
                this._navimiLoader[this._promiseNS + url] = resolve;
                this._navimiLoader[this._promiseNS + url + "_reject"] = reject;

                this._fetch(abortController, url, type).catch(reject);
            });
        }

        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    public loadDependencies = (abortController: AbortController, jsUrl: string, services: string[], components: string[]): Promise<any[]> => {

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

        const promises = servicesUrls.filter(url => url !== undefined)
            .map(url => this.fetchJS(abortController, [url], "service"))
            .concat(componentsUrls.filter(url => url !== undefined)
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
        
        return Promise.all(promises);
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
