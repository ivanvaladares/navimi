class __Navimi_JSs implements INavimi_JSs {

    private _navimiLoaderNS = "__navimiLoader";
    private _callBackNS = "_jsLoaderCallback";
    private _promiseNS = "_promise_";

    private _loadedJSs: INavimi_KeyList<string> = {};
    private _jsType: INavimi_KeyList<jsType> = {};
    private _jsInstances: INavimi_KeyList<InstanceType<any>> = {};
    private _jsDepMap: INavimi_KeyList<INavimi_KeyList<boolean>> = {};
    private _servicesList: INavimi_KeyList<string[]> = {};

    private _navimiLoader: any;
    private _options: INavimi_Options;
    private _uidCounter = 0;

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
        this._uidCounter = 0;

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
                        return this._navimiCSSs.insertCss(obj.url, 'library', true);
                    });
                } else {
                    return this.fetchJS(undefined, [obj.url], type === "module" ? "module" : "library");
                }
            })).catch(ex => {
                throw new Error(ex)
            });

        }
    };

    private _fetch = async (abortController: AbortController, url: string, type: jsType): Promise<void> => {
        let jsCode = "";
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
        this._insertJS(url, jsCode.replace(/^\s+|\s+$/g, ''), type);
    };

    private _insertJS = (url: string, jsCode: string, type: jsType): void => {
        const jsHtmlBody = (type === "module" || type === "library") ? jsCode :
        `((loader, url, type) => { loader(url, type, (() => { return ${jsCode}
})())})(${this._navimiLoaderNS}.${this._callBackNS}, "${url}", "${type}")`;
    
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

    private _buildRoute = async (jsUrl: string, JsClass: InstanceType<any>): Promise<InstanceType<any>> => {

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const jss = this;

        let routeClass = JsClass;

        if (Array.isArray(JsClass)) {
            //get last element of array
            routeClass = JsClass.pop();

            //add all other elements are expected to be services names
            const services = JsClass.filter(s => typeof s === "string");
            if (services.length > 0) {
                this.loadServices(undefined, jsUrl, services);
            }
        }

        //wait for all dependencies to load
        const dependencies = [];
        for (const deps in this._jsDepMap) {
            if (this._jsDepMap[deps][jsUrl]) {
                dependencies.push(deps);
            }
        }
        await Promise.all(dependencies.map(this._awaitJS));

        //gather required services
        let services: INavimi_KeyList<InstanceType<any>> = {};
        this._servicesList[jsUrl]?.map((serviceName: string) => {
            services = {
                ...services,
                [serviceName]: this._jsInstances[this._options.services[serviceName]]
            };
        });

        const uid = ++this._uidCounter;
        
        const route = class extends (routeClass) {

            constructor() {

                const functions: INavimi_Functions = {
                    addLibrary: jss._addLibrary,
                    setTitle: jss._navimiHelpers.setTitle,
                    navigateTo: (window as any).navigateTo,
                    getTemplate: jss._navimiTemplates.getTemplate,
                    fetchJS: (url: string | string[]) => {
                        const urls = Array.isArray(url) ? url : [url];
                        urls.map(u => {
                            jss._jsDepMap[u] = {
                                ...jss._jsDepMap[u] || {},
                                [jsUrl]: true
                            };
                        });
                        return jss.fetchJS(undefined, urls, "javascript");
                    },
                    fetchTemplate: (url: string | string[]) => {
                        return jss._navimiTemplates.fetchTemplate(undefined, url);
                    },
                    setState: jss._navimiState.setState,
                    getState: jss._navimiState.getState,
                    setNavimiLinks: jss._navimiHelpers.setNavimiLinks,
                    unwatchState: (key: string) => jss._navimiState.unwatchState(uid, key),
                    watchState: (key: string, callback: (state: INavimi_KeyList<any>) => void) =>
                        jss._navimiState.watchState(uid, key, callback),
                };

                super(Object.freeze(functions), Object.freeze(services));
            }

            onEnter(params: INavimi_KeyList<string>): void {
                if (super.onEnter) {
                    super.onEnter(params);
                }
            }

            onBeforeLeave(params: INavimi_KeyList<string>): boolean {
                if (super.onBeforeLeave) {
                    return super.onBeforeLeave(params);
                }
                return true;
            }

            onLeave(): void {
                if (super.onLeave) {
                    super.onLeave();
                }
            }

            destroy(): void {
                jss._navimiState.unwatchState(uid);
                if (super.destroy) {
                    super.destroy();
                }
            }

        };

        return new route();

    };

    private _buildComponentClass = async (jsUrl: string, JsClass: InstanceType<any>): Promise<InstanceType<any>> => {

        const componentName = Object.keys(this._options.components)
            .find((name: string) => this._options.components[name] === jsUrl);

        if (!componentName || !/-/.test(componentName)) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const jss = this;

        let componentClass = JsClass;

        if (Array.isArray(JsClass)) {
            //get last element of array
            componentClass = JsClass.pop();

            //add all other elements are expected to be services names
            const services = JsClass.filter(s => typeof s === "string");
            if (services.length > 0) {
                this.loadServices(undefined, jsUrl, services);
            }
        }

        //wait for all dependencies to load
        const dependencies = [];
        for (const deps in this._jsDepMap) {
            if (this._jsDepMap[deps][jsUrl]) {
                dependencies.push(deps);
            }
        }
        await Promise.all(dependencies.map(this._awaitJS));

        //gather required services
        let services: INavimi_KeyList<InstanceType<any>> = {};
        this._servicesList[jsUrl]?.map((serviceName: string) => {
            services = {
                ...services,
                [serviceName]: this._jsInstances[this._options.services[serviceName]]
            };
        });

        Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);

        const uid = ++this._uidCounter;
        
        const component = class extends (componentClass) {

            constructor(props: any) {

                const functions: INavimi_Functions = {
                    addLibrary: jss._addLibrary,
                    setTitle: jss._navimiHelpers.setTitle,
                    navigateTo: (window as any).navigateTo,
                    getTemplate: jss._navimiTemplates.getTemplate,
                    fetchJS: (url: string | string[]) => {
                        const urls = Array.isArray(url) ? url : [url];
                        urls.map(u => {
                            jss._jsDepMap[u] = {
                                ...jss._jsDepMap[u] || {},
                                [jsUrl]: true
                            };
                        });
                        return jss.fetchJS(undefined, urls, "javascript");
                    },
                    fetchTemplate: (url: string | string[]) => {
                        return jss._navimiTemplates.fetchTemplate(undefined, url);
                    },
                    setState: jss._navimiState.setState,
                    getState: jss._navimiState.getState,
                    setNavimiLinks: jss._navimiHelpers.setNavimiLinks,
                    unwatchState: (key: string) => jss._navimiState.unwatchState(uid, key),
                    watchState: (key: string, callback: (state: INavimi_KeyList<any>) => void) =>
                        jss._navimiState.watchState(uid, key, callback),
                };
                                
                super(props, Object.freeze(functions), Object.freeze(services));
            }

            async init() {
                super.init && await super.init();
                await this.render();
                super.onMount && await super.onMount();
            }

            async render() {

                this.__rendered = true;

                const html = super.render && await super.render(this.__initalInnerHTML);

                if (html && html !== this.__previousTemplate) {

                    this.__previousTemplate = html;

                    const domParser = new DOMParser();

                    const template = domParser.parseFromString(html, "text/html");

                    jss._navimiComponents.mergeHtml(template.querySelector("body"), this as unknown as DocumentFragment);

                    jss._navimiComponents.registerChildComponents(this as unknown as INavimi_Component);
                }

                super.onRender && super.onRender();
            }

            onUnmount(): void {
                jss._navimiState.unwatchState(uid);
                if (super.onUnmount) {
                    super.onUnmount();
                }
            }

        };

        this._navimiComponents.registerComponent(componentName, component);

        return component;

    };

    private _instantiateJS = async (
        jsUrl: string,
        type: jsType,
        JsCode: InstanceType<any>): Promise<void> => {
    
        try {

            if (type === "route" || type === "component") {
                const instance = type === "route" ? 
                    await this._buildRoute(jsUrl, JsCode):
                    await this._buildComponentClass(jsUrl, JsCode);

                //keep this instance to reuse later
                this._jsInstances[jsUrl] = instance;

                return this._resolvePromise(instance, jsUrl);
            }

            // for services and javascripts
            this._jsInstances[jsUrl] = JsCode;
            return this._resolvePromise(JsCode, jsUrl);

        } catch (error) {
            this._rejectPromise(error, jsUrl);
        }

    };

    private _isJsLoading = (jsUrl: string): boolean => {
        return this._navimiLoader[this._promiseNS + jsUrl] !== undefined &&
            !this._navimiFetch.getErrors(jsUrl);
    };

    private _checkDepsUrls = (jsUrl: string, depArray: string[], type: "services" | "components"): string[] => {
        const notFound: string[] = [];
        if (!this._servicesList[jsUrl]) {
            this._servicesList[jsUrl] = [];
        }
        const urls = (depArray || []).map(name => {
            //@ts-ignore
            const url: string = this._options[type] && this._options[type][name];
            if (url === undefined) {
                notFound.push(name);
            } else {
                type === "services" &&
                    this._servicesList[jsUrl].indexOf(name) === -1 &&
                    this._servicesList[jsUrl].push(name);

                this._jsDepMap[url] = {
                    ...this._jsDepMap[url] || {},
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

    public loadServices = (abortController: AbortController, jsUrl: string, services: string[]): Promise<any[]> => {

        if (!jsUrl) {
            return;
        }

        const servicesUrls = this._checkDepsUrls(jsUrl, services, "services");

        const promises = servicesUrls.filter(url => url !== undefined)
            .map(url => this.fetchJS(abortController, [url], "service"));

        return Promise.all(promises);
    };

    public loadComponents = (abortController: AbortController, jsUrl: string, components: string[]): Promise<any[]> => {

        if (!jsUrl) {
            return;
        }

        const componentsUrls = this._checkDepsUrls(jsUrl, components, "components");

        const promises = componentsUrls.filter(url => url !== undefined)
            .map(url => this.fetchJS(abortController, [url], "component"));

        return Promise.all(promises);
    };

    public initRoute = async (jsUrl: string, params: INavimi_KeyList<any>): Promise<void> => {

        const jsInstance = this.getInstance(jsUrl);

        jsInstance && jsInstance.onEnter &&
            await jsInstance.onEnter(params);

    };

    //removeIf(minify)
    public digestHot = async ({ filePath, data }: hotPayload): Promise<void> => {

        const destroyed: string[] = [];

        const destroyDependencies = (url: string): void => {

            for (const jsUrl in this._jsDepMap[url]) {

                if (destroyed.indexOf(jsUrl) === -1) {
                    destroyDependencies(jsUrl);
                }
            }

            destroyed.indexOf(url) === -1 && destroyed.push(url);
            const instance = this.getInstance(url);
            instance && instance.destroy && instance.destroy();
            delete this._navimiLoader[this._promiseNS + url];
            delete this._jsInstances[url];
        }

        if (!this.isJsLoaded(filePath)) {
            return Promise.reject();
        }

        const type = this._jsType[filePath];

        //destroy all instances
        if (type === "library" || type === "module") {
            for (const jsUrl in this._jsDepMap) {
                destroyDependencies(jsUrl);
            }
            for (const jsUrl in this._jsInstances) {
                destroyDependencies(jsUrl);
            }
        } else {
            destroyDependencies(filePath);
        }

        return new Promise<InstanceType<any>>((resolve) => {
            this._navimiLoader[this._promiseNS + filePath] = resolve;

            this._insertJS(filePath, data.replace(/^\s+|\s+$/g, ''), type);

            console.log(`${filePath} updated.`);
        });

    };
    //endRemoveIf(minify)
}

//removeIf(dist)
module.exports.jss = __Navimi_JSs
//endRemoveIf(dist)
