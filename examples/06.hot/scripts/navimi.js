/**
 * Navimi v0.1.1 
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com 
 * https://github.com/ivanvaladares/navimi 
 */ 
var __Navimi_CSSs;
(function (__Navimi_CSSs) {
    const loadedCsss = {};
    __Navimi_CSSs.isCssLoaded = (url) => {
        return loadedCsss[url] !== undefined;
    };
    __Navimi_CSSs.getCss = (url) => {
        return loadedCsss[url];
    };
    __Navimi_CSSs.fetchCss = (abortController, url, autoInsert) => {
        return new Promise(async (resolve, reject) => {
            if (!url || loadedCsss[url]) {
                return resolve();
            }
            try {
                const cssCode = await __Navimi_Fetch.fetchFile(url, {
                    headers: {
                        Accept: "text/css"
                    },
                    signal: abortController ? abortController.signal : undefined
                });
                if (autoInsert) {
                    __Navimi_Dom.insertCss(cssCode, url, true);
                    loadedCsss[url] = "loaded";
                }
                else {
                    loadedCsss[url] = cssCode;
                }
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    __Navimi_CSSs.reloadCss = (filePath, cssCode, routeList, currentJS, globalCssUrl) => {
        const isSameFile = __Navimi_Helpers.isSameFile;
        if (isSameFile(globalCssUrl, filePath)) {
            console.log(`${filePath} updated.`);
            loadedCsss[globalCssUrl] = cssCode;
            __Navimi_Dom.insertCss(cssCode, "globalCss");
            return;
        }
        for (const routeUrl in routeList) {
            const { jsUrl, cssUrl } = routeList[routeUrl];
            if (isSameFile(cssUrl, filePath)) {
                console.log(`${filePath} updated.`);
                loadedCsss[cssUrl] = cssCode;
                if (currentJS === jsUrl) {
                    __Navimi_Dom.insertCss(cssCode, "routeCss");
                }
                return;
            }
        }
    };
})(__Navimi_CSSs || (__Navimi_CSSs = {}));
// flag(s) to indicate uglify to add/remove code from the output
const INCLUDEHOT = true;
const EXCLUDEHOT = false;
var __Navimi_Dom;
(function (__Navimi_Dom) {
    __Navimi_Dom.setTitle = (title) => {
        document.title = title;
    };
    __Navimi_Dom.setNavimiLinks = (navigateTo) => {
        document.querySelectorAll("[navimi-link]").forEach(el => {
            el.removeAttribute("navimi-link");
            el.setAttribute("navimi-linked", "");
            el.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(e.target.pathname);
            });
        });
    };
    __Navimi_Dom.insertCss = (cssCode, type, prepend) => {
        const oldTag = type ? document.querySelector(`[cssId='${type}']`) : undefined;
        oldTag && oldTag.remove();
        if (!cssCode) {
            return;
        }
        const style = document.createElement("style");
        style.innerHTML = cssCode;
        type && style.setAttribute("cssId", type);
        const head = document.getElementsByTagName("head")[0];
        const target = (head || document.body);
        prepend ? target.prepend(style) : target.appendChild(style);
    };
    __Navimi_Dom.insertJS = (jsCode, jsUrl) => {
        const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
        oldTag && oldTag.remove();
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.innerHTML = jsCode;
        script.setAttribute("jsUrl", jsUrl);
        const head = document.getElementsByTagName("head")[0];
        (head || document.body).appendChild(script);
    };
    __Navimi_Dom.addLibrary = async (jsOrCssUrl) => {
        let urls = Array.isArray(jsOrCssUrl) ? jsOrCssUrl : [jsOrCssUrl];
        urls = urls.filter(url => !__Navimi_JSs.isJsLoaded(url));
        urls.length > 0 && await Promise.all(urls.map(url => {
            const type = url.split(".").pop();
            if (type.toLowerCase() === "css") {
                __Navimi_CSSs.fetchCss(undefined, url, true);
            }
            else {
                return __Navimi_JSs.fetchJS(undefined, [url]);
            }
        })).catch(ex => {
            throw new Error(ex);
        });
    };
})(__Navimi_Dom || (__Navimi_Dom = {}));
var __Navimi_Fetch;
(function (__Navimi_Fetch) {
    let bustCache;
    __Navimi_Fetch.loadErrors = {};
    __Navimi_Fetch.init = (options) => {
        bustCache = options.bustCache;
    };
    __Navimi_Fetch.fetchFile = (url, options) => {
        return new Promise((resolve, reject) => {
            delete __Navimi_Fetch.loadErrors[url];
            const requestUrl = url + (bustCache ? '?v=' + bustCache : '');
            //todo: add retry with options
            fetch(requestUrl, options)
                .then(async (data) => {
                if (!data || !data.ok) {
                    const error = `Could not load the file! - ${url}`;
                    __Navimi_Fetch.loadErrors[url] = error;
                    return reject(error);
                }
                resolve(await data.text());
            })
                .catch(ex => {
                __Navimi_Fetch.loadErrors[url] = ex.message;
                reject(ex);
            });
        });
    };
})(__Navimi_Fetch || (__Navimi_Fetch = {}));
var __Navimi_Helpers;
(function (__Navimi_Helpers) {
    const parseQuery = (queryString) => {
        const query = {};
        queryString.split('&').map(pair => {
            const kv = pair.split('=');
            query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        return query;
    };
    const splitPath = (path) => {
        if (!path) {
            return [];
        }
        const queryPos = path.indexOf("?");
        path = queryPos >= 0 ? path.substr(0, queryPos) : path;
        return path.split("/").filter(p => p.length > 0);
    };
    const parsePath = (urlPath, urlPattern) => {
        const queryPos = urlPath.indexOf("?");
        const query = queryPos > 0 ? urlPath.substr(queryPos + 1, urlPath.length) : "";
        const path = splitPath(urlPath);
        const pattern = splitPath(urlPattern);
        let params = {};
        if (queryPos > 0) {
            params = {
                queryString: parseQuery(query)
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
                if (!path[i] || pattern[i].toLowerCase() !== path[i].toLowerCase())
                    return null;
            }
        }
        return params;
    };
    __Navimi_Helpers.isSameFile = (path1, path2) => {
        return path1 && path2 && path1.split("?").shift().toLowerCase() ==
            path2.split("?").shift().toLowerCase();
    };
    __Navimi_Helpers.timeout = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
    __Navimi_Helpers.debounce = (task, ms) => {
        let timeout;
        return function () {
            const func = () => {
                timeout = null;
                task.apply(this, arguments);
            };
            clearTimeout(timeout);
            timeout = setTimeout(func, ms);
        };
    };
    __Navimi_Helpers.getUrl = () => {
        const location = document.location;
        const matches = location.toString().match(/^[^#]*(#.+)$/);
        const hash = matches ? matches[1] : "";
        return [location.pathname, location.search, hash].join("");
    };
    __Navimi_Helpers.removeHash = (url) => {
        const hashPos = url.indexOf("#");
        return hashPos > 0 ? url.substr(0, hashPos) : url;
    };
    __Navimi_Helpers.stringify = (obj) => {
        const visited = [];
        const iterateObject = (obj) => {
            if (typeof obj === 'function') {
                return String(obj);
            }
            if (obj instanceof Error) {
                return obj.message;
            }
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            if (visited.indexOf(obj) !== -1) {
                return `[Circular: ${visited.indexOf(obj)}]`;
            }
            visited.push(obj);
            if (Array.isArray(obj)) {
                const aResult = obj.map(iterateObject);
                visited.pop();
                return aResult;
            }
            const result = Object.keys(obj).reduce((result, prop) => {
                result[prop] = iterateObject(((obj, prop) => {
                    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                        try {
                            return obj[prop];
                        }
                        catch (_a) {
                            return;
                        }
                    }
                    return obj[prop];
                })(obj, prop));
                return result;
            }, {});
            visited.pop();
            return result;
        };
        return JSON.stringify(iterateObject(obj));
    };
    __Navimi_Helpers.cloneObject = (obj) => {
        return obj === null || typeof obj !== "object" ? obj :
            Object.keys(obj).reduce((prev, current) => obj[current] !== null && typeof obj[current] === "object" ?
                (prev[current] = __Navimi_Helpers.cloneObject(obj[current]), prev) :
                (prev[current] = obj[current], prev), Array.isArray(obj) ? [] : {});
    };
    __Navimi_Helpers.getRouteAndParams = (url, routingList) => {
        const urlParams = splitPath(url);
        const catchAll = routingList["*"];
        let routeItem, params;
        for (const routeUrl in routingList) {
            const routeParams = splitPath(routeUrl);
            if (routeParams.length === urlParams.length) {
                params = parsePath(url, routeUrl);
                if (params) {
                    routeItem = routingList[routeUrl];
                    break;
                }
            }
        }
        if (!routeItem && catchAll) {
            routeItem = catchAll;
        }
        return { routeItem, params };
    };
})(__Navimi_Helpers || (__Navimi_Helpers = {}));
var __Navimi_Hot;
(function (__Navimi_Hot) {
    let wsHotClient;
    __Navimi_Hot.openHotWs = (hotOption, callback) => {
        if (INCLUDEHOT) {
            try {
                if (!('WebSocket' in window)) {
                    console.error("Websocket is not supported by your browser!");
                    return;
                }
                console.warn("Connecting HOT...");
                const port = hotOption === true ? 8080 : hotOption;
                wsHotClient = null;
                wsHotClient = new WebSocket(`ws://localhost:${port}`);
                wsHotClient.addEventListener('message', (e) => {
                    try {
                        const json = JSON.parse(e.data || "");
                        if (json.message) {
                            console.warn(json.message);
                            return;
                        }
                        if (json.filePath) {
                            callback((globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute) => {
                                digestHot(json, globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute);
                            });
                        }
                    }
                    catch (ex) {
                        console.error("Could not parse HOT message:", ex);
                    }
                });
                wsHotClient.onclose = () => {
                    console.warn('HOT Connection Closed!');
                    setTimeout(__Navimi_Hot.openHotWs, 5000, hotOption);
                };
            }
            catch (ex) {
                console.error(ex);
            }
        }
    };
    const digestHot = (payload, globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute) => {
        try {
            const filePath = payload.filePath.replace(/\\/g, "/");
            const fileType = filePath.split(".").pop();
            const data = payload.data;
            switch (fileType) {
                case "css":
                    __Navimi_CSSs.reloadCss(filePath, data, routesList, currentJs, globalCssUrl);
                    break;
                case "html":
                case "htm":
                    __Navimi_Templates.reloadTemplate(filePath, data, routesList, currentJs, globalTemplatesUrl, () => {
                        initRoute();
                    });
                    break;
                case "js":
                    __Navimi_JSs.reloadJs(filePath, data, routesList, currentJs, () => {
                        initRoute();
                    });
                    break;
                case "gif":
                case "jpg":
                case "jpeg":
                case "png":
                case "svg":
                    initRoute();
                    break;
            }
        }
        catch (ex) {
            console.error("Could not digest HOT payload: ", ex);
        }
    };
})(__Navimi_Hot || (__Navimi_Hot = {}));
var __Navimi_JSs;
(function (__Navimi_JSs) {
    const navimiLoaderNS = "__navimiLoader";
    const callBackNS = "_jsLoaderCallback";
    const promiseNS = "_promise_";
    const loadedJSs = {};
    const externalJSs = {};
    const routesJSs = {};
    const dependencyJSsMap = {};
    const routesJSsServices = {};
    let navimiLoader;
    let navigateTo;
    let options;
    const awaitJS = (jsUrl) => {
        return new Promise((resolve, reject) => {
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
    const fetch = (abortController, url, external) => {
        return new Promise(async (resolve, reject) => {
            try {
                let jsCode;
                if (typeof loadedJSs[url] === "string") {
                    jsCode = loadedJSs[url];
                }
                else {
                    jsCode = await __Navimi_Fetch.fetchFile(url, {
                        headers: {
                            Accept: "application/javascript"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });
                }
                insertJS(url, jsCode, external);
                if (external === undefined) {
                    navimiLoader[promiseNS + url](true); // resolve the promise - script is loaded
                }
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    const insertJS = (url, jsCode, external) => {
        let jsHtmlBody = external !== undefined ?
            `(function(){window.${navimiLoaderNS}.${callBackNS}("${url}", ${external}, (function(){return ${jsCode}   
            })())}())` : jsCode;
        loadedJSs[url] = external ? true : jsCode;
        __Navimi_Dom.insertJS(jsHtmlBody, url);
    };
    const instantiateJS = async (jsUrl, external, //todo: change to isRouteScript
    JsClass) => {
        const promiseToResolve = navimiLoader[promiseNS + jsUrl];
        const promiseToReject = navimiLoader[promiseNS + jsUrl + "_reject"];
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
                fetchJS: (url) => {
                    const urls = Array.isArray(url) ? url : [url];
                    urls.map(u => {
                        dependencyJSsMap[u] = Object.assign(Object.assign({}, dependencyJSsMap[u] || {}), { [jsUrl]: true });
                    });
                    return __Navimi_JSs.fetchJS(undefined, urls, true);
                },
                fetchTemplate: (url) => {
                    const urls = Array.isArray(url) ? url : [url];
                    return __Navimi_Templates.fetchTemplate(undefined, urls, jsUrl);
                },
                setState: __Navimi_State.setState,
                getState: __Navimi_State.getState,
                setNavimiLinks: () => __Navimi_Dom.setNavimiLinks(navigateTo),
                unwatchState: (key) => __Navimi_State.unwatchState(jsUrl, key),
                watchState: (key, callback) => __Navimi_State.watchState(jsUrl, key, callback),
            });
            let services;
            if (routesJSsServices[jsUrl] && routesJSsServices[jsUrl].length > 0) {
                while (true) {
                    if (routesJSsServices[jsUrl].map((sn) => externalJSs[options.services[sn]] === undefined).indexOf(true) === -1) {
                        break;
                    }
                    if (routesJSsServices[jsUrl].map(sn => options.services[sn]).find(su => __Navimi_Fetch.loadErrors[su])) {
                        return;
                    }
                    await __Navimi_Helpers.timeout(10);
                }
                routesJSsServices[jsUrl].map((sn) => {
                    services = Object.assign(Object.assign({}, services), { [sn]: externalJSs[options.services[sn]] });
                });
            }
            let jsInstance = new JsClass(routerFunctions, services);
            //keep this instance to reuse later
            routesJSs[jsUrl] = jsInstance;
            promiseToResolve && promiseToResolve(jsInstance);
        }
        catch (error) {
            promiseToReject && promiseToReject(error);
        }
    };
    __Navimi_JSs.init = (config) => {
        navigateTo = config.navigateTo;
        options = config.options;
        // @ts-ignore
        navimiLoader = window[navimiLoaderNS] = {
            [callBackNS]: instantiateJS, // initialize JS loader namespace
        };
    };
    __Navimi_JSs.isJsLoaded = (url) => {
        return loadedJSs[url] !== undefined;
    };
    __Navimi_JSs.getInstance = (url) => {
        return routesJSs[url];
    };
    __Navimi_JSs.fetchJS = (abortController, urls, external) => {
        const init = (url) => {
            return new Promise(async (resolve, reject) => {
                // return the instance if this js is already loaded
                if (external && externalJSs[url]) {
                    return resolve(externalJSs[url]);
                }
                else {
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
        };
        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };
    __Navimi_JSs.loadServices = (abortController, jsUrl, services) => {
        if (!jsUrl || !services || services.length === 0) {
            return;
        }
        routesJSsServices[jsUrl] = routesJSsServices[jsUrl] || [];
        if (services && services.length > 0) {
            let notFoundServices = [];
            const servicesUrls = services.map(sn => {
                const su = options.services && options.services[sn];
                if (su === undefined) {
                    notFoundServices.push(sn);
                }
                else {
                    routesJSsServices[jsUrl].indexOf(sn) === -1 && routesJSsServices[jsUrl].push(sn);
                    dependencyJSsMap[su] = Object.assign(Object.assign({}, dependencyJSsMap[su] || {}), { [jsUrl]: true });
                }
                return su;
            });
            if (notFoundServices.length > 0) {
                throw new Error("Service(s) not defined: " + notFoundServices.join(", "));
            }
            Promise.all(servicesUrls.filter(su => su !== undefined)
                .map(su => __Navimi_JSs.fetchJS(abortController, [su], true)));
        }
    };
    __Navimi_JSs.initJS = async (jsUrl, params) => {
        const jsInstance = __Navimi_JSs.getInstance(jsUrl);
        jsInstance && jsInstance.init &&
            await jsInstance.init(params);
    };
    __Navimi_JSs.reloadJs = (filePath, jsCode, routeList, currentJS, callback) => {
        const isSameFile = __Navimi_Helpers.isSameFile;
        for (const routeUrl in routeList) {
            const { jsUrl } = routeList[routeUrl];
            if (isSameFile(jsUrl, filePath)) {
                console.log(`${filePath} updated.`);
                delete routesJSs[jsUrl];
                navimiLoader[promiseNS + jsUrl] = () => {
                    if (jsUrl === currentJS) {
                        //reload route if current JS is updated
                        callback();
                    }
                };
                insertJS(jsUrl, jsCode, false);
                return;
            }
        }
        for (const jsUrl in dependencyJSsMap) {
            if (isSameFile(jsUrl, filePath)) {
                console.log(`${filePath} updated.`);
                delete externalJSs[jsUrl];
                navimiLoader[promiseNS + jsUrl] = () => {
                    Object.keys(dependencyJSsMap[jsUrl]).map(s => {
                        //clear all dependent JSs that depends of this JS
                        delete routesJSs[s];
                        if (s === currentJS) {
                            //reload route if current JS is updated
                            callback();
                        }
                    });
                };
                insertJS(filePath, jsCode, true);
            }
        }
    };
})(__Navimi_JSs || (__Navimi_JSs = {}));
var __Navimi_Middleware;
(function (__Navimi_Middleware) {
    const middlewareStack = [];
    __Navimi_Middleware.addMiddlewares = (middlewares) => {
        if (Array.isArray(middlewares)) {
            middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
        }
    };
    __Navimi_Middleware.executeMiddlewares = async (abortController, context, callback) => {
        let prevIndex = -1;
        const runner = async (resolve, reject, index = 0) => {
            if (index === prevIndex) {
                console.warn('next() called multiple times');
            }
            prevIndex = index;
            const middleware = middlewareStack[index];
            if (middleware) {
                await middleware(context, async (url, params) => {
                    if (abortController.signal.aborted) {
                        reject();
                    }
                    else {
                        if (!url) {
                            await runner(resolve, reject, index + 1);
                        }
                        else {
                            reject();
                            callback(url, params);
                        }
                    }
                });
            }
            else {
                resolve();
            }
        };
        await new Promise(await runner).catch(_ => { });
    };
})(__Navimi_Middleware || (__Navimi_Middleware = {}));
class Navimi {
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
    * @param {((context: Object.<string, *>, next:(url: string, params?: Object.<string, *>) => void) => void)[]=} options.middlewares - An array of functions to capture the request
    * @param {(number | boolean)=} options.hot - The port to the websocket at localhost
    * @param {string=} options.bustCache - Some string to add to the url to bust the cache. eg: /somepath/somefile.js?v=[string will be added to the url]
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onAfterRoute - A function invoked after the routing is done
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onBeforeRoute - A function invoked before middlewares and routing
    * @param {function(Error): void=} options.onError - A function to capture erros from routes
    * @returns {Object} - The Navimi instance
    */
    constructor(routes, options) {
        this.navigateTo = (url, params) => {
            this.initRoute(url, params);
        };
        this.reportError = (error) => {
            if (this.options.onError) {
                this.options.onError(error);
                return;
            }
            console.error(error);
        };
        this.initRoute = async (urlToGo, navParams, force) => {
            const url = __Navimi_Helpers.removeHash(urlToGo || __Navimi_Helpers.getUrl());
            if (!force) {
                if (this.currentUrl === url) {
                    return;
                }
                this.abortController.abort();
                this.abortController = new AbortController();
            }
            const callId = ++this.callId;
            const pushState = urlToGo !== undefined;
            let { routeItem, params } = __Navimi_Helpers.getRouteAndParams(url, this.routesList);
            if (navParams !== undefined) {
                params = Object.assign(Object.assign({}, params), navParams);
            }
            if (this.options.onBeforeRoute) {
                const shouldContinue = await this.options.onBeforeRoute({ url, routeItem, params }, this.navigateTo);
                if (shouldContinue === false) {
                    return;
                }
            }
            if (this.currentJS && !force) {
                const currentJsInstance = __Navimi_JSs.getInstance(this.currentJS);
                if (currentJsInstance) {
                    const beforeLeave = currentJsInstance.beforeLeave;
                    if (beforeLeave) {
                        const shouldContinue = beforeLeave({ url, routeItem, params });
                        if (shouldContinue === false) {
                            if (!pushState) {
                                history.forward();
                            }
                            return;
                        }
                    }
                    currentJsInstance.destroy && currentJsInstance.destroy();
                }
            }
            if (!routeItem) {
                callId === this.callId && this.reportError(new Error("No route match for url: " + url));
                return;
            }
            await __Navimi_Middleware.executeMiddlewares(this.abortController, { url, routeItem, params }, (url, params) => {
                this.initRoute(url, params, true);
            });
            if (callId < this.callId) {
                console.warn("Navimi: A middleware has called navigateTo()");
                return;
            }
            this.currentUrl = url;
            try {
                const { title, jsUrl, cssUrl, templatesUrl, dependsOn } = routeItem || {};
                if (!jsUrl && !templatesUrl) {
                    throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");
                }
                if (jsUrl) {
                    this.currentJS = jsUrl;
                    this.routesParams[jsUrl] = { url, routeItem, params };
                }
                if (pushState) {
                    if (navParams === null || navParams === void 0 ? void 0 : navParams.replaceUrl) {
                        history.replaceState(null, null, urlToGo);
                    }
                    else {
                        history.pushState(null, null, urlToGo);
                    }
                }
                __Navimi_CSSs.fetchCss(this.abortController, cssUrl).catch(_ => { });
                __Navimi_Templates.fetchTemplate(this.abortController, [templatesUrl]).catch(_ => { });
                try {
                    __Navimi_JSs.loadServices(this.abortController, jsUrl, dependsOn);
                }
                catch (ex) {
                    this.reportError(ex);
                }
                if (jsUrl) {
                    await __Navimi_JSs.fetchJS(this.abortController, [jsUrl], false);
                }
                //wait css and template to load if any
                while ((cssUrl && !__Navimi_CSSs.isCssLoaded(cssUrl)) ||
                    (templatesUrl && !__Navimi_Templates.isTemplateLoaded(templatesUrl)) ||
                    (this.options.globalCssUrl &&
                        !__Navimi_CSSs.isCssLoaded(this.options.globalCssUrl)) ||
                    (this.options.globalTemplatesUrl &&
                        !__Navimi_Templates.isTemplateLoaded(this.options.globalTemplatesUrl))) {
                    await __Navimi_Helpers.timeout(10);
                    if (callId < this.callId) {
                        return;
                    }
                    //check if any load error occured
                    if ((cssUrl && __Navimi_Fetch.loadErrors[cssUrl]) ||
                        (templatesUrl && __Navimi_Fetch.loadErrors[templatesUrl]) ||
                        (this.options.globalCssUrl &&
                            __Navimi_Fetch.loadErrors[this.options.globalCssUrl]) ||
                        (this.options.globalTemplatesUrl &&
                            __Navimi_Fetch.loadErrors[this.options.globalTemplatesUrl])) {
                        this.reportError(new Error(__Navimi_Fetch.loadErrors[cssUrl] ||
                            __Navimi_Fetch.loadErrors[templatesUrl] ||
                            __Navimi_Fetch.loadErrors[this.options.globalCssUrl] ||
                            __Navimi_Fetch.loadErrors[this.options.globalTemplatesUrl]));
                        return;
                    }
                }
                __Navimi_Dom.setTitle(title);
                try {
                    if (jsUrl) {
                        await __Navimi_JSs.initJS(jsUrl, this.routesParams[jsUrl]);
                    }
                    else {
                        const template = __Navimi_Templates.getTemplate(templatesUrl);
                        const body = document.querySelector("body");
                        if (template && body) {
                            body.innerHTML = template;
                        }
                        return;
                    }
                }
                catch (ex) {
                    this.reportError(ex);
                }
                finally {
                    if (callId < this.callId) {
                        return;
                    }
                    __Navimi_Dom.setNavimiLinks(this.navigateTo);
                    __Navimi_Dom.insertCss(__Navimi_CSSs.getCss(cssUrl), "routeCss");
                    this.options.onAfterRoute &&
                        this.options.onAfterRoute({ url, routeItem, params }, this.navigateTo);
                }
            }
            catch (ex) {
                this.reportError(ex);
            }
        };
        this.callId = 0;
        this.abortController = new AbortController();
        this.currentJS = undefined;
        this.currentUrl = undefined;
        this.routesParams = {};
        this.routesList = routes || {};
        this.options = options || {};
        this.win = window ? window : {};
        //@ts-ignore
        this.win.addEventListener('popstate', () => {
            this.initRoute();
        });
        //@ts-ignore
        this.win.navigateTo = this.navigateTo;
        __Navimi_JSs.init({
            navigateTo: this.navigateTo.bind(this),
            options: this.options,
        });
        __Navimi_Fetch.init(this.options);
        //add middlewares
        __Navimi_Middleware.addMiddlewares(this.options.middlewares);
        (async () => {
            if (this.options.globalCssUrl || this.options.globalTemplatesUrl) {
                await Promise.all([
                    __Navimi_CSSs.fetchCss(undefined, this.options.globalCssUrl),
                    __Navimi_Templates.fetchTemplate(undefined, [this.options.globalTemplatesUrl]),
                ]).catch(this.reportError);
                __Navimi_Dom.insertCss(__Navimi_CSSs.getCss(this.options.globalCssUrl), "globalCss");
            }
        })();
        this.initRoute();
        if (this.options.hot) {
            if (EXCLUDEHOT) {
                console.warn('HOT is disabled! Use the unminified version to enable it.');
            }
            if (INCLUDEHOT) {
                setTimeout(__Navimi_Hot.openHotWs, 1000, this.options.hot, (callback) => {
                    callback(this.options.globalCssUrl, this.options.globalTemplatesUrl, this.currentJS, this.routesList, () => {
                        this.initRoute(undefined, this.routesParams[this.currentJS], true);
                    });
                });
            }
        }
    }
}
var __Navimi_State;
(function (__Navimi_State) {
    const state = {};
    const stateWatchers = {};
    let prevState = {};
    let stateDiff = {};
    const getStateDiff = (keys) => {
        keys.sort((a, b) => b.length - a.length).map(key => {
            if (!stateDiff[key]) {
                const sOld = __Navimi_Helpers.stringify(__Navimi_State.getState(key, prevState) || "");
                const sNew = __Navimi_Helpers.stringify(__Navimi_State.getState(key, state) || "");
                if (sOld !== sNew) {
                    stateDiff[key] = true;
                    //set upper keys as changed so we don't test them again
                    keys.map(upperKey => {
                        if (key !== upperKey && key.indexOf(upperKey) === 0) {
                            stateDiff[upperKey] = true;
                        }
                    });
                }
            }
        });
    };
    const invokeStateWatchers = __Navimi_Helpers.debounce(() => {
        const keys = Object.keys(stateWatchers);
        const diff = Object.keys(stateDiff);
        stateDiff = {};
        keys.filter(key => diff.includes(key)).sort((a, b) => b.length - a.length).map(key => {
            Object.keys(stateWatchers[key]).map((cs) => {
                const sNew = __Navimi_State.getState(key);
                stateWatchers[key][cs] &&
                    stateWatchers[key][cs].map((cb) => cb && cb(sNew));
            });
        });
    }, 10);
    const mergeState = (state, newState) => {
        if (newState instanceof Error) {
            newState = Object.assign(Object.assign({}, newState), { message: newState.message, stack: newState.stack });
        }
        const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
        if (isObject(state) && isObject(newState)) {
            for (const key in newState) {
                if (isObject(newState[key])) {
                    !state[key] && Object.assign(state, { [key]: {} });
                    mergeState(state[key], newState[key]);
                }
                else {
                    Object.assign(state, { [key]: newState[key] });
                }
            }
        }
    };
    __Navimi_State.setState = (newState) => {
        const observedKeys = Object.keys(stateWatchers);
        if (observedKeys.length > 0) {
            prevState = __Navimi_Helpers.cloneObject(state);
        }
        mergeState(state, newState);
        if (observedKeys.length > 0) {
            getStateDiff(observedKeys);
            invokeStateWatchers();
        }
    };
    __Navimi_State.getState = (key, _state) => {
        const st = key ?
            key.split('.').reduce((v, k) => (v && v[k]) || undefined, _state || state) :
            _state || state;
        return st ? Object.freeze(__Navimi_Helpers.cloneObject(st)) : undefined;
    };
    __Navimi_State.watchState = (jsUrl, key, callback) => {
        if (!key || !callback) {
            return;
        }
        if (!stateWatchers[key]) {
            stateWatchers[key] = {};
        }
        stateWatchers[key] = Object.assign(Object.assign({}, stateWatchers[key]), { [jsUrl]: [
                ...(stateWatchers[key][jsUrl] || []),
                callback
            ] });
    };
    __Navimi_State.unwatchState = (jsUrl, key) => {
        const remove = (key) => {
            stateWatchers[key][jsUrl] = undefined;
            delete stateWatchers[key][jsUrl];
            Object.keys(stateWatchers[key]).length === 0 &&
                delete stateWatchers[key];
        };
        if (key) {
            const keys = Array.isArray(key) ? key : [key];
            keys.map(id => {
                !stateWatchers[id] && (stateWatchers[id] = {});
                remove(id);
            });
            return;
        }
        Object.keys(stateWatchers).map(remove);
    };
})(__Navimi_State || (__Navimi_State = {}));
var __Navimi_Templates;
(function (__Navimi_Templates) {
    let templatesCache = {};
    let loadedTemplates = {};
    let dependencyTemplatesMap = {};
    const loadTemplate = (templateCode, url) => {
        const regIni = new RegExp("<t ([^>]+)>");
        const regEnd = new RegExp("</t>");
        const regId = new RegExp("id=\"([^\"]+)\"");
        let tempCode = templateCode;
        if (!regIni.exec(tempCode)) {
            templatesCache[url] = tempCode;
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
            templatesCache[idTemplate] = tempCode.substr(0, endTemplate.index);
        }
    };
    __Navimi_Templates.isTemplateLoaded = (url) => {
        return loadedTemplates[url] !== undefined;
    };
    __Navimi_Templates.getTemplate = (templateId) => {
        const ids = Array.isArray(templateId) ? templateId : [templateId];
        const arrTemplates = ids.map(id => templatesCache[id]);
        return arrTemplates.length > 1 ? arrTemplates : arrTemplates[0];
    };
    __Navimi_Templates.fetchTemplate = (abortController, urls, jsUrl) => {
        const init = (url) => {
            return new Promise(async (resolve, reject) => {
                if (!url || loadedTemplates[url]) {
                    return resolve();
                }
                try {
                    const templateCode = await __Navimi_Fetch.fetchFile(url, {
                        headers: {
                            Accept: "text/html"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });
                    loadTemplate(templateCode, url);
                    loadedTemplates[url] = true;
                    resolve();
                }
                catch (ex) {
                    reject(ex);
                }
            });
        };
        if (jsUrl) {
            urls.map((u) => {
                dependencyTemplatesMap[u] = Object.assign(Object.assign({}, dependencyTemplatesMap[u] || {}), { [jsUrl]: true });
            });
        }
        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };
    __Navimi_Templates.reloadTemplate = (filePath, templateCode, routeList, currentJS, globalTemplatesUrl, callback) => {
        const isSameFile = __Navimi_Helpers.isSameFile;
        if (isSameFile(globalTemplatesUrl, filePath)) {
            console.log(`${filePath} updated.`);
            loadTemplate(templateCode, globalTemplatesUrl);
            callback();
            return;
        }
        for (const routeUrl in routeList) {
            const { jsUrl, templatesUrl } = routeList[routeUrl];
            if (isSameFile(templatesUrl, filePath)) {
                console.log(`${filePath} updated.`);
                loadTemplate(templateCode, templatesUrl);
                currentJS === jsUrl && callback();
                return;
            }
        }
        for (const templatesUrl in dependencyTemplatesMap) {
            if (isSameFile(templatesUrl, filePath)) {
                console.log(`${filePath} updated.`);
                loadTemplate(templateCode, templatesUrl);
                Object.keys(dependencyTemplatesMap[templatesUrl]).map(s => {
                    if (s === currentJS) {
                        //reload route if current JS is updated
                        callback();
                    }
                });
            }
        }
    };
})(__Navimi_Templates || (__Navimi_Templates = {}));
