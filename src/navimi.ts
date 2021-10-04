/*! 
 * Navimi v0.0.1
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com
 * https://github.com/ivanvaladares/navimi
 */

interface Route {
    title: string;
    jsUrl?: string;
    cssUrl?: string;
    templatesUrl?: string;
    dependsOn?: string[];
    metadata?: { [key: string]: any };
}

interface Functions {
    addLibrary: (jsOrCssUrl: string | string[]) => Promise<void>;
    fetchJS: (jsUrl: string | string[]) => Promise<InstanceType<any> | InstanceType<any>[]>;
    fetchTemplate: (templateUrl: string | string[]) => Promise<void | void[]>;
    getState: (key?: string) => any;
    getTemplate: (templateId: string | string[]) => string | string[];
    navigateTo: (url: string, params?: { [key: string]: any }) => void;
    setNavimiLinks: () => void;
    setTitle: (title: string) => void;
    setState: (state: { [key: string]: any }) => void;
    unwatchState: (key?: string | string[]) => void;
    watchState: (key: string, callback: (state: any) => void) => void;
}

type Next = () => Promise<void> | void;
type Context = { url: string, routeItem: Route, params: { [key: string]: any } };
type Middleware = (context: Context, navigateTo: (url: string, params?: { [key: string]: any }) => void, next: Next) => Promise<void> | void;

interface Options {
    globalCssUrl?: string;
    globalTemplatesUrl?: string;
    services?: { [serviceName: string]: string };
    middlewares?: Middleware[];
    hot?: number | boolean;
    onAfterRoute?: (context: Context, navigateTo: (url: string, params?: { [key: string]: any }) => void) => void;
    onBeforeRoute?: (context: Context, navigateTo: (url: string, params?: { [key: string]: any }) => void) => boolean;
    onError?: (error: Error) => void;
}

class Navimi {

    private controller: AbortController;
    private currentRouteItem: Route;
    private currentJS: string;
    private currentUrl: string;
    private currentParams: { [url: string]: any };
    private routingList: { [url: string]: Route };
    private loadErrors: { [url: string]: any };
    private loadedJs: { [url: string]: boolean };
    private loadedTemplates: { [url: string]: boolean };
    private loadedCsss: { [url: string]: string };
    private templatesCache: { [templateId: string]: string };
    private routesJSs: { [url: string]: InstanceType<any> }
    private routesJSsServices: { [url: string]: string[] }
    private externalJSs: { [url: string]: InstanceType<any> }
    private externalJSsMap: { [url: string]: { [url: string]: boolean } }
    private externalTemplatesMap: { [url: string]: { [url: string]: boolean } }
    private wsHotClient: WebSocket;
    private options: Options;
    private pagesNamespace: string;
    private pagesMainCallBack: string;
    private callbackNS: string;
    private win: any;
    private state: { [key: string]: any };
    private prevState: { [key: string]: any };
    private stateDiff: { [key: string]: boolean };
    private stateWatchers: { [key: string]: any };
    private middlewareStack: Middleware[];
    private callId: number;

    /**
    * @typedef {Object} Route - An route definition
    * @property {string} routes.title - The title that will be displayed on the browser
    * @property {string} routes.jsUrl - The path to the route script
    * @property {string=} routes.cssUrl - The path to the route css
    * @property {string=} routes.templatesUrl - The path to the templates file of this route 
    * @property {string[]=} routes.dependsOn - An array of services names for this route
    * @property {Object.<string, *>=} routes.metadata - Any literal you need to pass down to this route and middlewares 
    * @param {Object.<string, Route>} routes - A collection of Route
    * @param {Object} [options] - Navimi options 
    * @param {string=} options.globalCssUrl - The path to the global css
    * @param {string=} options.globalTemplatesUrl - The path to the global templates file
    * @param {Object.<string, string>=} options.services - A collection of all services {[service name]: script path}
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void, next:() => void) => void)[]=} options.middlewares - An array of functions to capture the request
    * @param {(number | boolean)=} options.hot - The port to the websocket at localhost
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onAfterRoute - A function invoked after the routing is done
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onBeforeRoute - A function invoked before middlewares and routing
    * @param {function(Error): void=} options.onError - A function to capture erros from routes
    * @returns {Object} - The Navimi instance 
    */
    constructor(routes: { [url: string]: Route }, options?: Options) {

        this.pagesNamespace = "__spaPages";
        this.pagesMainCallBack = "_mainCallback";
        this.callbackNS = "_callback_";
        this.win = window ? window : {};
        this.controller = new AbortController();
        this.currentRouteItem = undefined;
        this.currentJS = undefined;
        this.currentUrl = undefined;
        this.currentParams = {};
        this.routesJSs = {};
        this.routesJSsServices = {};
        this.externalJSs = {};
        this.externalJSsMap = {};
        this.externalTemplatesMap = {};
        this.routingList = routes || {};
        this.loadErrors = {};
        this.loadedCsss = {};
        this.loadedJs = {};
        this.loadedTemplates = {};
        this.templatesCache = {};
        this.options = options || {};
        this.state = {};
        this.prevState = {};
        this.stateDiff = {};
        this.stateWatchers = {};
        this.middlewareStack = [];
        this.callId = 0;

        //@ts-ignore
        this.win.addEventListener('popstate', () => {
            this.initRoute();
        });

        //@ts-ignore
        this.win.navigateTo = this.navigateTo;

        // initialize JS loader namespace
        this.win[this.pagesNamespace] = {};

        //add middlewares
        const middlewares = this.options.middlewares;
        if (Array.isArray(middlewares)) {
            this.middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
        }

        (async () => {
            if (this.options.globalCssUrl || this.options.globalTemplatesUrl) {
                await Promise.all([
                    this.fetchCss(this.options.globalCssUrl, true),
                    this.fetchTemplate(false, [this.options.globalTemplatesUrl]),
                ]).catch(this.reportError);
                this.insertCss(this.loadedCsss[this.options.globalCssUrl], "globalCss");
            }
        })();

        this.initRoute();

        if (this.options.hot && 'WebSocket' in this.win) {
            setTimeout(this.openHotWs, 1000, this.options.hot);
        }
    }

    private timeout = (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    private debounce = (task: (args: any[]) => any, ms: number): () => void => {
        let timeout: any;
        return function () {
            const func = (): void => {
                timeout = null;
                task.apply(this, arguments);
            };
            clearTimeout(timeout);
            timeout = setTimeout(func, ms);
        };
    };

    private setNavimiLinks = (): void => {
        document.querySelectorAll("[navimi-link]").forEach(el => {
            el.removeAttribute("navimi-link");
            el.setAttribute("navimi-linked", "");
            el.addEventListener('click', (e: any) => {
                e.preventDefault();
                this.navigateTo(e.target.pathname);
            });
        });
    }

    private navigateTo = (url: string, params?: { [key: string]: any }): void => {
        this.initRoute(url, params);
    };

    private setTitle = (title: string): void => {
        document.title = title;
    };

    private getUrl = (): string => {
        const location = document.location;
        const matches = location.toString().match(/^[^#]*(#.+)$/);
        const hash = matches ? matches[1] : "";
        return [location.pathname, location.search, hash].join("");
    };

    private splitPath = (path: string): string[] => {
        if (!path) {
            return [];
        }

        const queryPos = path.indexOf("?");
        path = queryPos >= 0 ? path.substr(0, queryPos) : path;

        return path.split("/").filter(p => p.length > 0);
    };

    private removeHash = (url: string): string => {
        const hashPos = url.indexOf("#");
        return hashPos > 0 ? url.substr(0, hashPos) : url;
    };

    private parseQuery = (queryString: string): { [key: string]: string } => {
        const query: { [key: string]: string } = {};
        queryString.split('&').map(pair => {
            const kv = pair.split('=');
            query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        return query;
    };

    private parsePath = (urlPath: string, urlPattern: string): { [key: string]: any } => {
        const queryPos = urlPath.indexOf("?");
        const query = queryPos > 0 ? urlPath.substr(queryPos + 1, urlPath.length) : "";
        const path = this.splitPath(urlPath);
        const pattern = this.splitPath(urlPattern);

        let params: any = {};

        if (queryPos > 0) {
            params = {
                queryString: this.parseQuery(query)
            };
        }

        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i].charAt(0) === ':') {
                const name = pattern[i].slice(1);
                if (path.length <= i) {
                    return null;
                }
                params[name] = decodeURIComponent(path[i]);
            }
            else {
                if (!path[i] || pattern[i].toLocaleLowerCase() !== path[i].toLocaleLowerCase())
                    return null;
            }
        }

        return params;
    };

    private getStateDiff = (keys: string[]): void => {
        keys.sort((a, b) => b.length - a.length).map(key => {
            if (!this.stateDiff[key]) {
                const sOld = JSON.stringify(this.getState(key, this.prevState) || "");
                const sNew = JSON.stringify(this.getState(key, this.state) || "");
                if (sOld !== sNew) {
                    this.stateDiff[key] = true;
                    //set upper keys as changed so we don't test them again
                    keys.map(upperKey => {
                        if (key !== upperKey && key.indexOf(upperKey) === 0) {
                            this.stateDiff[upperKey] = true;
                        }
                    });
                }
            }
        });
    };

    private invokeStateWatchers = this.debounce((): void => {
        const keys = Object.keys(this.stateWatchers);
        const diff = Object.keys(this.stateDiff);
        this.stateDiff = {};
        keys.filter(key => diff.includes(key)).sort((a, b) => b.length - a.length).map(key => {
            Object.keys(this.stateWatchers[key]).map((cs: string) => {
                const sNew = this.getState(key);
                this.stateWatchers[key][cs] &&
                    this.stateWatchers[key][cs].map((cb: (state: any) => void) => cb && cb(sNew));
            });
        });
    }, 10);


    private mergeState(state: any, newState: any): void {
        const isObject = (item: any): boolean =>
            item && typeof item === 'object' && !Array.isArray(item) && item !== null;
        if (isObject(state) && isObject(newState)) {
            for (const key in newState) {
                if (isObject(newState[key])) {
                    !state[key] && Object.assign(state, { [key]: {} });
                    this.mergeState(state[key], newState[key]);
                } else {
                    Object.assign(state, { [key]: newState[key] });
                }
            }
        }
    }

    private setState = (newState: { [key: string]: any }): void => {
        const observedKeys = Object.keys(this.stateWatchers);
        if (observedKeys.length > 0) {
            this.prevState = JSON.parse(JSON.stringify(this.state));
        }
        this.mergeState(this.state, newState);
        if (observedKeys.length > 0) {
            this.getStateDiff(observedKeys);
            this.invokeStateWatchers();
        }
    };

    private getState = (key?: string, state?: any): { [key: string]: any } => {
        const st = key ?
            key.split('.').reduce((v, k) => (v && v[k]) || undefined, state || this.state) :
            state || this.state;
        return st ? Object.freeze(JSON.parse(JSON.stringify(st))) : undefined;
    };

    private watchState = (jsUrl: string, key: string, callback: (state: any) => void): void => {
        if (!key || !callback) {
            return;
        }
        if (!this.stateWatchers[key]) {
            this.stateWatchers[key] = {};
        }
        this.stateWatchers[key] = {
            ...this.stateWatchers[key],
            [jsUrl]: [
                ...(this.stateWatchers[key][jsUrl] || []),
                callback
            ]
        };
    };

    private unwatchState = (jsUrl: string, key?: string | string[]): void => {
        const remove = (key: string): void => {
            this.stateWatchers[key][jsUrl] = undefined;
            delete this.stateWatchers[key][jsUrl];
            Object.keys(this.stateWatchers[key]).length === 0 &&
                delete this.stateWatchers[key];
        }

        if (key) {
            const keys = Array.isArray(key) ? key : [key];
            keys.map(id => {
                !this.stateWatchers[id] && (this.stateWatchers[id] = {});
                remove(id);
            });
            return;
        }

        Object.keys(this.stateWatchers).map(remove);
    };

    private reportError = (error: string): void => {
        if (this.options.onError) {
            this.options.onError(Error(error));
            return;
        }
        console.error(error);
    }

    private openHotWs = (hotOption: number | boolean): void => {
        try {
            console.log("Connecting HOT...");
            const port = hotOption === true ? 8080 : hotOption;
            this.wsHotClient = null;
            this.wsHotClient = new WebSocket(`ws://localhost:${port}`);
            this.wsHotClient.addEventListener('message', (e: any) => {
                try {
                    const json: any = JSON.parse(e.data || "");
                    if (json.message) {
                        console.log(json.message);
                        return;
                    }
                    if (json.filePath) {
                        this.digestHot(json);
                    }
                } catch (ex) {
                    console.error("Could not parse HOT message:", ex);
                }
            });
            this.wsHotClient.onclose = () => {
                console.warn('HOT Connection Closed!');
                setTimeout(this.openHotWs, 5000, hotOption);
            };
        } catch (ex) {
            console.error(ex);
        }
    };

    private digestHot = (file: any): void => {
        const isSameFile = (path1: string, path2: string) => {
            return path1 && path2 && path1.split("?").shift().toLocaleLowerCase() ==
                path2.split("?").shift().toLocaleLowerCase();
        }

        try {
            const filePath = file.filePath.replace(/\\/g, "/");
            const pages: any = this.win[this.pagesNamespace];

            if (isSameFile(this.options.globalCssUrl, filePath)) {
                console.log(`${file.filePath} updated.`);
                this.loadedCsss[file.filePath] = file.data;
                this.insertCss(file.data, "globalCss");
                return;
            }

            if (this.currentJS && isSameFile(this.options.globalTemplatesUrl, filePath)) {
                console.log(`${file.filePath} updated.`);
                this.parseTemplate(file.data, this.options.globalTemplatesUrl);
                this.initJS(this.currentJS);
                this.setNavimiLinks();
                return;
            }

            if (this.currentJS && this.externalJSsMap[filePath]) {
                console.log(`${file.filePath} updated.`);
                pages[this.callbackNS + filePath] = () => {
                    Object.keys(this.externalJSsMap[filePath]).map(s => {
                        this.routesJSs[s] = undefined;
                        if (s === this.currentJS) {
                            this.initRoute(undefined, undefined, true);
                        }
                    });
                };
                this.insertJS(file.data, filePath, true);
                return;
            }

            if (this.currentJS && this.externalTemplatesMap[filePath]) {
                console.log(`${file.filePath} updated.`);
                this.parseTemplate(file.data);
                Object.keys(this.externalTemplatesMap[filePath])
                    .find(s => s === this.currentJS) &&
                    this.initJS(this.currentJS);
                return;
            }

            for (const routeUrl in this.routingList) {
                const routeItem = this.routingList[routeUrl];

                if (this.currentJS && isSameFile(routeItem.jsUrl, filePath)) {
                    if (this.routesJSs[routeItem.jsUrl]) {
                        console.log(`${file.filePath} updated.`);
                        this.routesJSs[routeItem.jsUrl] = undefined;
                        pages[this.callbackNS + routeItem.jsUrl] = () => {
                            this.currentJS === routeItem.jsUrl &&
                                this.initJS(this.currentJS);
                        };
                        this.insertJS(file.data, routeItem.jsUrl, false);
                        this.setNavimiLinks();
                    }
                    return;
                }

                if (isSameFile(routeItem.cssUrl, filePath)) {
                    console.log(`${file.filePath} updated.`);
                    this.loadedCsss[routeItem.cssUrl] = file.data;
                    (this.currentJS && this.currentJS === routeItem.jsUrl ||
                        routeItem.cssUrl === this.currentRouteItem.cssUrl) &&
                            this.insertCss(file.data, "pageCss");
                    return;
                }

                if (isSameFile(routeItem.templatesUrl, filePath)) {
                    console.log(`${file.filePath} updated.`);
                    this.parseTemplate(file.data, routeItem.templatesUrl);
                    (this.currentJS && this.currentJS === routeItem.jsUrl  ||
                        routeItem.templatesUrl === this.currentRouteItem.templatesUrl) &&
                            this.initJS(this.currentJS);
                    this.setNavimiLinks();
                    return;
                }
            }

        } catch (ex) {
            console.error("Could not digest HOT message: ", ex);
        }
    };

    private fetchFile = (url: string, options?: RequestInit): Promise<string> => {
        return new Promise((resolve, reject) => {
            delete this.loadErrors[url];
            //todo: add retry
            fetch(url, options)
                .then(async (data) => {
                    if (!data || !data.ok) {
                        const error = `Could not load the file! - ${url}`;
                        this.loadErrors[url] = error;
                        return reject(error);
                    }
                    resolve(await data.text());
                })
                .catch(ex => {
                    this.loadErrors[url] = ex.message;
                    reject(ex);
                });
        });
    };

    private parseTemplate = (templateCode: string, url?: string): void => {
        const regIni = new RegExp("<t ([^>]+)>");
        const regEnd = new RegExp("</t>");
        const regId = new RegExp("id=\"([^\"]+)\"");
        let tempCode = templateCode;

        if (!regIni.exec(tempCode)) {
            this.templatesCache[url] = tempCode;
            return;
        }

        while (templateCode && templateCode.length > 0) {
            const iniTemplate = regIni.exec(tempCode);

            if (!iniTemplate || iniTemplate.length === 0) {
                break;
            }

            const regIdRes = regId.exec(iniTemplate[1]);
            const idTemplate = regIdRes.length > 0 && regIdRes[1];
            tempCode = tempCode.substr(iniTemplate.index + iniTemplate[0].length);
            const endTemplate = regEnd.exec(tempCode);

            if (!idTemplate || !endTemplate || endTemplate.length === 0) {
                break;
            }

            this.templatesCache[idTemplate] = tempCode.substr(0, endTemplate.index);
        }
    };

    private fetchTemplate = (isCancelable: boolean, urls: string[]): Promise<void | void[]> => {
        const init = (url: string): Promise<void> => {
            return new Promise(async (resolve, reject) => {
                if (!url || this.loadedTemplates[url]) {
                    return resolve();
                }
                try {
                    const templateCode = await this.fetchFile(url, {
                        headers: {
                            Accept: "text/html"
                        },
                        signal: isCancelable ? this.controller.signal : undefined
                    });

                    this.parseTemplate(templateCode, url);
                    this.loadedTemplates[url] = true;
                    resolve();

                } catch (ex) {
                    reject(ex);
                }
            });
        };
        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    private fetchCss = (url: string, isGlobal?: boolean, autoInsert?: boolean): Promise<void | void[]> => {
        return new Promise<void>(async (resolve, reject) => {
            if (!url || this.loadedCsss[url]) {
                return resolve();
            }
            try {
                const cssCode = await this.fetchFile(url, {
                    headers: {
                        Accept: "text/css"
                    },
                    signal: isGlobal ? undefined : this.controller.signal
                });

                if (autoInsert) {
                    this.insertCss(cssCode, undefined, true);
                    this.loadedCsss[url] = "loaded";
                } else {
                    this.loadedCsss[url] = cssCode;
                }
                resolve();

            } catch (ex) {
                reject(ex);
            }
        });
    };

    private fetchJS = (url: string, external?: boolean): Promise<void | void[]> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const jsCode = await this.fetchFile(url, {
                    headers: {
                        Accept: "application/javascript"
                    },
                    signal: this.controller.signal
                });

                this.loadedJs[url] = true;
                this.insertJS(jsCode, url, external);
                resolve();

            } catch (ex) {
                reject(ex);
            }
        });
    };

    private addLibrary = async (jsOrCssUrl: string | string[]): Promise<void> => {
        let urls = Array.isArray(jsOrCssUrl) ? jsOrCssUrl : [jsOrCssUrl];
        urls = urls.filter(url => !this.loadedJs[url]);

        urls.length > 0 && await Promise.all(urls.map(url => {
            const type = url.split(".").pop();
            if (type.toLocaleLowerCase() === "css") {
                return this.fetchCss(url, false, true);
            }
            return this.fetchJS(url)
        })).catch(ex => {
            throw new Error(ex)
        });

        return;
    };

    private insertCss = (cssCode: string, type?: string, prepend?: boolean): void => {
        const oldTag = type ? document.querySelector(`[${type}]`) : undefined;
        oldTag && oldTag.remove();
        if (!cssCode) {
            return;
        }
        const style: HTMLStyleElement = document.createElement("style");
        style.innerHTML = cssCode;
        type && style.setAttribute(type, "");
        const head = document.getElementsByTagName("head")[0];
        const target = (head || document.body);
        prepend ? target.prepend(style) : target.appendChild(style);
    };

    private insertJS = (jsCode: string, jsUrl: string, external?: boolean): void => {
        const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
        oldTag && oldTag.remove();

        let jsHtmlBody = external !== undefined ?
            `(function(){window.${this.pagesNamespace}.${this.pagesMainCallBack}("${jsUrl}", ${external}, (function(){return ${jsCode}   
    })())}())` : jsCode;

        const script: HTMLScriptElement = document.createElement("script");
        script.type = "text/javascript";
        script.innerHTML = jsHtmlBody;
        script.setAttribute("jsUrl", jsUrl);
        const head = document.getElementsByTagName("head")[0];
        (head || document.body).appendChild(script);
    };

    private getTemplate = (templateId: string | string[]): string | string[] => {
        const ids = Array.isArray(templateId) ? templateId : [templateId];
        const arrTemplates = ids.map(id => this.templatesCache[id]);
        return arrTemplates.length > 1 ? arrTemplates : arrTemplates[0];
    };

    private executeMiddlewares = async (context: Context, callId: number): Promise<void> => {
        let prevIndex = -1;
        const runner = async (index: number, resolve: any, reject: any): Promise<void> => {
            if (index === prevIndex) {
                throw new Error('next() called multiple times')
            }
            prevIndex = index;
            const middleware = this.middlewareStack[index];
            if (middleware) {
                let didNext = false;
                await middleware(context, this.navigateTo, () => {
                    didNext = true;
                    if (callId === this.callId) {
                        runner(index + 1, resolve, reject);
                    }
                });
                if (!didNext) {
                    reject();
                }
            } else {
                resolve();
            }
        }
        await new Promise(async (resolve, reject) => {
            await runner(0, resolve, reject);
        });
    };

    private setupRoute = async (routeItem: Route): Promise<InstanceType<any>> => {
        const pages: any = this.win[this.pagesNamespace];

        const instantiateJS = async (jsUrl: string, external: boolean, JsClass: InstanceType<any>) => {
            //remove callbacks
            setTimeout(() => {
                delete pages[this.callbackNS + jsUrl];
                delete pages[this.callbackNS + jsUrl + "_reject"];
            }, 1000);

            if (external) {
                //keep this instance to reuse later
                this.externalJSs[jsUrl] = JsClass;
                return Object.freeze(JsClass);
            }

            const routerFunctions = Object.freeze({
                addLibrary: this.addLibrary,
                setTitle: this.setTitle,
                navigateTo: this.navigateTo,
                getTemplate: this.getTemplate,
                fetchJS: (url: string | string[]) => {
                    const urls = Array.isArray(url) ? url : [url];
                    urls.map(u => {
                        this.externalJSsMap[u] = {
                            ...this.externalJSsMap[u] || {},
                            [jsUrl]: true
                        };
                    });
                    return fetchJS(true, urls);
                },
                fetchTemplate: (url: string) => {
                    const urls: string[] = Array.isArray(url) ? url : [url];
                    urls.map((u: string) => {
                        this.externalTemplatesMap[u] = {
                            ...this.externalTemplatesMap[u] || {},
                            [jsUrl]: true
                        };
                    });
                    return this.fetchTemplate(true, urls);
                },
                setState: this.setState,
                getState: this.getState,
                setNavimiLinks: this.setNavimiLinks,
                unwatchState: (key: string) => this.unwatchState(jsUrl, key),
                watchState: (key: string, callback: (state: any) => void) =>
                    this.watchState(jsUrl, key, callback),
            });

            let services: { [serviceName: string]: InstanceType<any> };

            if (this.routesJSsServices[jsUrl].length > 0) {
                while (true) {
                    if (this.routesJSsServices[jsUrl].map((sn: string) =>
                        this.externalJSs[this.options.services[sn]] === undefined).indexOf(true) === -1) {
                        break;
                    }
                    if (this.routesJSsServices[jsUrl].map(sn =>
                        this.options.services[sn]).find(su => this.loadErrors[su])) {
                        return;
                    }
                    await this.timeout(10);
                }

                this.routesJSsServices[jsUrl].map((sn: string) => {
                    services = {
                        ...services,
                        [sn]: this.externalJSs[this.options.services[sn]]
                    };
                });
            }

            try {
                this.unwatchState(jsUrl);
                let jsInstance = new JsClass(routerFunctions, services);
                //keep this instance to reuse later
                this.routesJSs[jsUrl] = jsInstance;
                return jsInstance;

            } catch (error) {
                pages[this.callbackNS + jsUrl + "_reject"](error);
            }

        };

        const awaitJS = (jsUrl: string) => {
            return new Promise<InstanceType<any>>((resolve, reject) => {

                const loadInterval = setInterval(() => {
                    if (this.routesJSs[jsUrl]) {
                        clearInterval(loadInterval);
                        return resolve(this.routesJSs[jsUrl]);
                    }
                    if (pages[this.callbackNS + jsUrl] === undefined) {
                        clearInterval(loadInterval);
                        return reject(`Error loading file! ${jsUrl}`);
                    }
                }, 50);

            });
        };

        const fetchJS = (external: boolean, urls: string[]): Promise<InstanceType<any> | InstanceType<any>[]> => {
            const init = (url: string): Promise<InstanceType<any>> => {
                return new Promise<InstanceType<any>>(async (resolve, reject) => {
                    // return the instance if this js is already loaded
                    if (external) {
                        if (this.externalJSs[url]) {
                            return resolve(this.externalJSs[url]);
                        }
                    } else {
                        if (this.routesJSs[url]) {
                            return resolve(this.routesJSs[url]);
                        }
                    }

                    // route repeated calls to an awaiter
                    if (pages[this.callbackNS + url]) {
                        await awaitJS(url)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    // let the js resolve the promise itself (*1)
                    pages[this.callbackNS + url] = resolve;
                    pages[this.callbackNS + url + "_reject"] = reject;

                    this.fetchJS(url, external).catch(ex => {
                        delete pages[this.callbackNS + url];
                        pages[this.callbackNS + url + "_reject"](ex);
                    });
                });
            }

            return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
        };

        // setup main callback
        if (!pages[this.pagesMainCallBack]) {
            // create the function to be called from the loaded js
            pages[this.pagesMainCallBack] = (jsUrl: string, external: boolean, JsClass: InstanceType<any>) => {
                // resolve the promise (*2)
                pages[this.callbackNS + jsUrl](instantiateJS(jsUrl, external, JsClass));
            };
        }

        const { jsUrl, cssUrl, templatesUrl, dependsOn } = routeItem;

        this.fetchCss(cssUrl).catch(_ => { });
        this.fetchTemplate(true, [templatesUrl]).catch(_ => { });

        if (!jsUrl) {
            return;
        }

        this.routesJSsServices[jsUrl] = this.routesJSsServices[jsUrl] || [];

        if (dependsOn && dependsOn.length > 0) {
            let notFoundServices: string[] = [];
            const servicesUrls = dependsOn.map(sn => {
                const su: string = this.options.services[sn];
                if (su === undefined) {
                    notFoundServices.push(sn);
                } else {
                    this.routesJSsServices[jsUrl].indexOf(sn) === -1 &&
                        this.routesJSsServices[jsUrl].push(sn);
                    this.externalJSsMap[su] = {
                        ...this.externalJSsMap[su] || {},
                        [jsUrl]: true
                    };
                }
                return su;
            });
            if (notFoundServices.length > 0) {
                this.reportError("Service(s) not defined: " + notFoundServices.join(", "));
                return;
            }
            Promise.all(servicesUrls.filter(su => su !== undefined)
                .map(su => fetchJS(true, [su])))
                .catch(this.reportError);
        }

        return fetchJS(false, [jsUrl]);
    };

    private initRoute = async (urlToGo?: string, navParams?: { [key: string]: any }, force?: boolean): Promise<void> => {
        const url = this.removeHash(urlToGo || this.getUrl());

        if (!force) {
            if (this.currentUrl === url) {
                return;
            }
            this.controller.abort();
            this.controller = new AbortController();
        }

        const callId = ++this.callId;
        const pushState = urlToGo !== undefined;
        const urlParams = this.splitPath(url);
        let routeItem;
        let params;

        for (const routeUrl in this.routingList) {
            const routeParams = this.splitPath(routeUrl);

            if (routeParams.length === urlParams.length) {
                params = this.parsePath(url, routeUrl);
                if (params) {
                    routeItem = this.routingList[routeUrl];
                    break;
                }
            }
        }

        const catchAll = this.routingList["*"];
        if (!routeItem && catchAll) {
            routeItem = catchAll;
        }

        if (navParams !== undefined) {
            params = {
                ...params,
                ...navParams
            };
        }

        if (this.options.onBeforeRoute) {
            const shouldContinue = await this.options.onBeforeRoute({ url, routeItem, params }, this.navigateTo);
            if (shouldContinue === false) {
                return;
            }
        } 

        if (this.currentJS && !force) {
            const beforeLeave = this.routesJSs[this.currentJS] &&
                this.routesJSs[this.currentJS].beforeLeave;
            if (beforeLeave) {
                if (beforeLeave({ url, routeItem, params }) === false) {
                    if (!pushState) {
                        history.forward();
                    }
                    return;
                }
            }
            this.routesJSs[this.currentJS] &&
                this.routesJSs[this.currentJS].destroy &&
                this.routesJSs[this.currentJS].destroy();
        }

        if (!routeItem) {
            callId === this.callId && this.reportError("No route match for url: " + url);
            return;
        }

        try {
            await this.executeMiddlewares({ url, routeItem, params }, callId);
        } catch (error) {
            return;
        }

        if (callId < this.callId) {
            return;
        }

        this.currentRouteItem = routeItem;
        this.currentUrl = url;

        try {

            const { title, jsUrl, cssUrl, templatesUrl } = routeItem || {};

            if (!jsUrl && !templatesUrl) {
                throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");
            }

            if (jsUrl) {
                this.currentJS = jsUrl;
                this.currentParams[jsUrl] = { url, routeItem, params };
            }

            if (pushState) {
                history.pushState(null, null, urlToGo);
            }

            await this.setupRoute(routeItem);

            //wait css and template to load if any
            while ((cssUrl && !this.loadedCsss[cssUrl]) ||
                (templatesUrl && !this.loadedTemplates[templatesUrl]) ||
                (this.options.globalCssUrl &&
                    !this.loadedCsss[this.options.globalCssUrl]) ||
                (this.options.globalTemplatesUrl &&
                    !this.loadedTemplates[this.options.globalTemplatesUrl])) {

                await this.timeout(10);
                if (callId < this.callId) {
                    return;
                }
                if ((cssUrl && this.loadErrors[cssUrl]) ||
                    (templatesUrl && this.loadErrors[templatesUrl]) ||
                    (this.options.globalCssUrl &&
                        this.loadErrors[this.options.globalCssUrl]) ||
                    (this.options.globalTemplatesUrl &&
                        this.loadErrors[this.options.globalTemplatesUrl])) {
                    this.reportError(
                        this.loadErrors[cssUrl] ||
                        this.loadErrors[templatesUrl] ||
                        this.loadErrors[this.options.globalCssUrl] ||
                        this.loadErrors[this.options.globalTemplatesUrl]);
                    return;
                }
            }

            this.setTitle(title);
            await this.initJS(jsUrl);

            if (callId < this.callId) {
                return;
            }

            this.setNavimiLinks();
            this.insertCss(this.loadedCsss[cssUrl], "pageCss");

            this.options.onAfterRoute && 
                this.options.onAfterRoute({ url, routeItem, params }, this.navigateTo);

        } catch (ex) {
            callId === this.callId && this.reportError(ex.message);
        }
    };

    private initJS = async (jsUrl: string): Promise<void> => {
        if (!jsUrl) {
            const url = this.currentRouteItem ? this.currentRouteItem.templatesUrl : null;
            const template = this.getTemplate(url) as string;
            const body = document.querySelector("body");
            if (template && body) {
                body.innerHTML = template;
            }
            return;
        }

        this.routesJSs[jsUrl] &&
            this.routesJSs[jsUrl].init &&
            await this.routesJSs[jsUrl].init(this.currentParams[jsUrl]);
    };
}