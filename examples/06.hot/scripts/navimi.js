/**
 * Navimi v0.2.1 
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com 
 * https://github.com/ivanvaladares/navimi 
 */ 
var __Navimi;
(function (__Navimi) {
    class Navimi_Core {
        constructor(routes, options, denpendencies) {
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
                    const currentJsInstance = this.navimiJs.getInstance(this.currentJS);
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
                await this.navimiMiddleware.executeMiddlewares(this.abortController, { url, routeItem, params }, (url, params) => {
                    this.initRoute(url, params, true);
                });
                if (callId < this.callId) {
                    if (__NAVIMI_DEV) {
                        console.warn("Navimi: A middleware has called navigateTo()");
                    }
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
                    this.navimiCss.fetchCss(this.abortController, cssUrl).catch(_ => { });
                    this.navimiTemplates.fetchTemplate(this.abortController, [templatesUrl]).catch(_ => { });
                    try {
                        this.navimiJs.loadServices(this.abortController, jsUrl, dependsOn);
                    }
                    catch (ex) {
                        this.reportError(ex);
                    }
                    if (jsUrl) {
                        await this.navimiJs.fetchJS(this.abortController, [jsUrl], false);
                    }
                    //wait css and template to load if any
                    while ((cssUrl && !this.navimiCss.isCssLoaded(cssUrl)) ||
                        (templatesUrl && !this.navimiTemplates.isTemplateLoaded(templatesUrl)) ||
                        (this.options.globalCssUrl &&
                            !this.navimiCss.isCssLoaded(this.options.globalCssUrl)) ||
                        (this.options.globalTemplatesUrl &&
                            !this.navimiTemplates.isTemplateLoaded(this.options.globalTemplatesUrl))) {
                        await __Navimi_Helpers.timeout(10);
                        if (callId < this.callId) {
                            return;
                        }
                        //check if any load error occured
                        if ((cssUrl && this.navimiFetch.loadErrors[cssUrl]) ||
                            (templatesUrl && this.navimiFetch.loadErrors[templatesUrl]) ||
                            (this.options.globalCssUrl &&
                                this.navimiFetch.loadErrors[this.options.globalCssUrl]) ||
                            (this.options.globalTemplatesUrl &&
                                this.navimiFetch.loadErrors[this.options.globalTemplatesUrl])) {
                            this.reportError(new Error(this.navimiFetch.loadErrors[cssUrl] ||
                                this.navimiFetch.loadErrors[templatesUrl] ||
                                this.navimiFetch.loadErrors[this.options.globalCssUrl] ||
                                this.navimiFetch.loadErrors[this.options.globalTemplatesUrl]));
                            return;
                        }
                    }
                    this.navimiDom.setTitle(title);
                    try {
                        if (jsUrl) {
                            await this.navimiJs.initJS(jsUrl, this.routesParams[jsUrl]);
                        }
                        else {
                            const template = this.navimiTemplates.getTemplate(templatesUrl);
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
                        this.navimiDom.setNavimiLinks();
                        this.navimiDom.insertCss(this.navimiCss.getCss(cssUrl), "routeCss");
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
            this.navimiFetch = denpendencies.navimiFetch;
            this.navimiDom = denpendencies.navimiDom;
            this.navimiCss = denpendencies.navimiCss;
            this.navimiJs = denpendencies.navimiJs;
            this.navimiTemplates = denpendencies.navimiTemplates;
            this.navimiMiddleware = denpendencies.navimiMiddleware;
            this.win.addEventListener('popstate', () => {
                this.initRoute();
            });
            this.win.navigateTo = this.navigateTo;
            //add middlewares
            this.navimiMiddleware.addMiddlewares(this.options.middlewares);
            (async () => {
                await this.init();
            })();
            this.initRoute();
            if (this.options.hot) {
                this.initHot();
            }
        }
        async init() {
            if (this.options.globalCssUrl || this.options.globalTemplatesUrl) {
                await Promise.all([
                    this.navimiCss.fetchCss(undefined, this.options.globalCssUrl),
                    this.navimiTemplates.fetchTemplate(undefined, [this.options.globalTemplatesUrl]),
                ]).catch(this.reportError);
                this.navimiDom.insertCss(this.navimiCss.getCss(this.options.globalCssUrl), "globalCss");
            }
        }
        initHot() {
            if (__NAVIMI_PROD) {
                console.warn('HOT is disabled! Use the unminified version to enable it.');
            }
            if (__NAVIMI_DEV) {
                const hot = new __Navimi.Navimi_hot({
                    reloadCss: this.navimiCss.reloadCss,
                    reloadTemplate: this.navimiTemplates.reloadTemplate,
                    reloadJs: this.navimiJs.reloadJs,
                });
                setTimeout(hot.openHotWs, 1000, this.options.hot, (callback) => {
                    callback(this.options.globalCssUrl, this.options.globalTemplatesUrl, this.currentJS, this.routesList, () => {
                        this.initRoute(undefined, this.routesParams[this.currentJS], true);
                    });
                });
            }
        }
    }
    __Navimi.Navimi_Core = Navimi_Core;
})(__Navimi || (__Navimi = {}));
var __Navimi;
(function (__Navimi) {
    class Navimi_CSSs {
        constructor() {
            this.loadedCsss = {};
            this.isCssLoaded = (url) => {
                return this.loadedCsss[url] !== undefined;
            };
            this.getCss = (url) => {
                return this.loadedCsss[url];
            };
            this.fetchCss = (abortController, url, autoInsert) => {
                return new Promise(async (resolve, reject) => {
                    if (!url || this.loadedCsss[url]) {
                        return resolve();
                    }
                    try {
                        const cssCode = await this.navimiFetch.fetchFile(url, {
                            headers: {
                                Accept: "text/css"
                            },
                            signal: abortController ? abortController.signal : undefined
                        });
                        if (autoInsert) {
                            this.domFunctions.insertCss(cssCode, url, true);
                            this.loadedCsss[url] = "loaded";
                        }
                        else {
                            this.loadedCsss[url] = cssCode;
                        }
                        resolve();
                    }
                    catch (ex) {
                        reject(ex);
                    }
                });
            };
            this.reloadCss = (filePath, cssCode, routeList, currentJS, globalCssUrl) => {
                const isSameFile = __Navimi_Helpers.isSameFile;
                if (isSameFile(globalCssUrl, filePath)) {
                    console.log(`${filePath} updated.`);
                    this.loadedCsss[globalCssUrl] = cssCode;
                    this.domFunctions.insertCss(cssCode, "globalCss");
                    return;
                }
                for (const routeUrl in routeList) {
                    const { jsUrl, cssUrl } = routeList[routeUrl];
                    if (isSameFile(cssUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        this.loadedCsss[cssUrl] = cssCode;
                        if (currentJS === jsUrl) {
                            this.domFunctions.insertCss(cssCode, "routeCss");
                        }
                        return;
                    }
                }
            };
        }
        init(_domFunctions, _navimiFetch) {
            this.domFunctions = _domFunctions;
            this.navimiFetch = _navimiFetch;
        }
    }
    __Navimi.Navimi_CSSs = Navimi_CSSs;
})(__Navimi || (__Navimi = {}));
// flag(s) to indicate uglify to add/remove code from the output
const __NAVIMI_DEV = true;
const __NAVIMI_PROD = false;
var __Navimi;
(function (__Navimi) {
    class Navimi_Dom {
        constructor() {
            this.setTitle = (title) => {
                document.title = title;
            };
            this.setNavimiLinks = () => {
                document.querySelectorAll("[navimi-link]").forEach(el => {
                    el.removeAttribute("navimi-link");
                    el.setAttribute("navimi-linked", "");
                    el.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.navigateTo(e.target.pathname);
                    });
                });
            };
            this.insertCss = (cssCode, type, prepend) => {
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
            this.insertJS = (jsCode, jsUrl) => {
                const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
                oldTag && oldTag.remove();
                const script = document.createElement("script");
                script.type = "text/javascript";
                script.innerHTML = jsCode;
                script.setAttribute("jsUrl", jsUrl);
                const head = document.getElementsByTagName("head")[0];
                (head || document.body).appendChild(script);
            };
            this.addLibrary = async (jsOrCssUrl) => {
                let urls = Array.isArray(jsOrCssUrl) ? jsOrCssUrl : [jsOrCssUrl];
                urls = urls.filter(url => !this.jsFunctions.isJsLoaded(url));
                urls.length > 0 && await Promise.all(urls.map(url => {
                    const type = url.split(".").pop();
                    if (type.toLowerCase() === "css") {
                        this.cssFunctions.fetchCss(undefined, url, true);
                    }
                    else {
                        return this.jsFunctions.fetchJS(undefined, [url]);
                    }
                })).catch(ex => {
                    throw new Error(ex);
                });
            };
        }
        init(_cssFunctions, _jsFunctions) {
            this.cssFunctions = _cssFunctions;
            this.jsFunctions = _jsFunctions;
        }
    }
    __Navimi.Navimi_Dom = Navimi_Dom;
})(__Navimi || (__Navimi = {}));
var __Navimi;
(function (__Navimi) {
    class Navimi_Fetch {
        constructor() {
            this.loadErrors = {};
            this.init = (options, _fetch) => {
                this.bustCache = options.bustCache;
                this.fetch = _fetch;
            };
            this.fetchFile = (url, options) => {
                return new Promise((resolve, reject) => {
                    delete this.loadErrors[url];
                    const requestUrl = url + (this.bustCache ? '?v=' + this.bustCache : '');
                    //todo: add retry with options
                    (this.fetch || fetch)(requestUrl, options)
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
        }
    }
    __Navimi.Navimi_Fetch = Navimi_Fetch;
})(__Navimi || (__Navimi = {}));
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
var __Navimi;
(function (__Navimi) {
    class Navimi_hot {
        constructor(_hotFunctions) {
            this.openHotWs = (hotOption, callback) => {
                if (__NAVIMI_DEV) {
                    try {
                        if (!('WebSocket' in window)) {
                            console.error("Websocket is not supported by your browser!");
                            return;
                        }
                        console.warn("Connecting HOT...");
                        const port = hotOption === true ? 8080 : hotOption;
                        this.wsHotClient = null;
                        this.wsHotClient = new WebSocket(`ws://localhost:${port}`);
                        this.wsHotClient.addEventListener('message', (e) => {
                            try {
                                const json = JSON.parse(e.data || "");
                                if (json.message) {
                                    console.warn(json.message);
                                    return;
                                }
                                if (json.filePath) {
                                    callback((globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute) => {
                                        this.digestHot(json, globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute);
                                    });
                                }
                            }
                            catch (ex) {
                                console.error("Could not parse HOT message:", ex);
                            }
                        });
                        this.wsHotClient.onclose = () => {
                            console.warn('HOT Connection Closed!');
                            setTimeout(this.openHotWs, 5000, hotOption);
                        };
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                }
            };
            this.digestHot = (payload, globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute) => {
                if (__NAVIMI_DEV) {
                    try {
                        const filePath = payload.filePath.replace(/\\/g, "/");
                        const fileType = filePath.split(".").pop();
                        const data = payload.data;
                        const { reloadCss, reloadTemplate, reloadJs } = this.hotFunctions;
                        switch (fileType) {
                            case "css":
                                reloadCss(filePath, data, routesList, currentJs, globalCssUrl);
                                break;
                            case "html":
                            case "htm":
                                reloadTemplate(filePath, data, routesList, currentJs, globalTemplatesUrl, () => {
                                    initRoute();
                                });
                                break;
                            case "js":
                                reloadJs(filePath, data, routesList, currentJs, () => {
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
                }
            };
            this.hotFunctions = _hotFunctions;
        }
    }
    __Navimi.Navimi_hot = Navimi_hot;
})(__Navimi || (__Navimi = {}));
var __Navimi;
(function (__Navimi) {
    class Navimi_JSs {
        constructor() {
            this.navimiLoaderNS = "__navimiLoader";
            this.callBackNS = "_jsLoaderCallback";
            this.promiseNS = "_promise_";
            this.loadedJSs = {};
            this.externalJSs = {};
            this.routesJSs = {};
            this.dependencyJSsMap = {};
            this.routesJSsServices = {};
            this.domFunctions = {};
            this.navimiFetch = {};
            this.navimiTemplates = {};
            this.awaitJS = (jsUrl) => {
                return new Promise((resolve, reject) => {
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
            this.fetch = (abortController, url, external) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        let jsCode;
                        if (typeof this.loadedJSs[url] === "string") {
                            jsCode = this.loadedJSs[url];
                        }
                        else {
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
                    }
                    catch (ex) {
                        reject(ex);
                    }
                });
            };
            this.insertJS = (url, jsCode, external) => {
                let jsHtmlBody = external !== undefined ?
                    `(function(){window.${this.navimiLoaderNS}.${this.callBackNS}("${url}", ${external}, (function(){return ${jsCode}   
                })())}())` : jsCode;
                this.loadedJSs[url] = external ? true : jsCode;
                this.domFunctions.insertJS(jsHtmlBody, url);
            };
            this.instantiateJS = async (jsUrl, external, //todo: change to isRouteScript
            JsClass) => {
                const promiseToResolve = this.navimiLoader[this.promiseNS + jsUrl];
                const promiseToReject = this.navimiLoader[this.promiseNS + jsUrl + "_reject"];
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
                        navigateTo: window.navigateTo,
                        getTemplate: this.navimiTemplates.getTemplate,
                        fetchJS: (url) => {
                            const urls = Array.isArray(url) ? url : [url];
                            urls.map(u => {
                                this.dependencyJSsMap[u] = Object.assign(Object.assign({}, this.dependencyJSsMap[u] || {}), { [jsUrl]: true });
                            });
                            return this.fetchJS(undefined, urls, true);
                        },
                        fetchTemplate: (url) => {
                            const urls = Array.isArray(url) ? url : [url];
                            return this.navimiTemplates.fetchTemplate(undefined, urls, jsUrl);
                        },
                        setState: this.navimiState.setState,
                        getState: this.navimiState.getState,
                        setNavimiLinks: this.domFunctions.setNavimiLinks,
                        unwatchState: (key) => this.navimiState.unwatchState(jsUrl, key),
                        watchState: (key, callback) => this.navimiState.watchState(jsUrl, key, callback),
                    });
                    let services;
                    if (this.routesJSsServices[jsUrl] && this.routesJSsServices[jsUrl].length > 0) {
                        while (true) {
                            if (this.routesJSsServices[jsUrl].map((sn) => this.externalJSs[this.options.services[sn]] === undefined).indexOf(true) === -1) {
                                break;
                            }
                            if (this.routesJSsServices[jsUrl].map(sn => this.options.services[sn]).find(su => this.navimiFetch.loadErrors[su])) {
                                return;
                            }
                            await __Navimi_Helpers.timeout(10);
                        }
                        this.routesJSsServices[jsUrl].map((sn) => {
                            services = Object.assign(Object.assign({}, services), { [sn]: this.externalJSs[this.options.services[sn]] });
                        });
                    }
                    let jsInstance = new JsClass(routerFunctions, services);
                    //keep this instance to reuse later
                    this.routesJSs[jsUrl] = jsInstance;
                    promiseToResolve && promiseToResolve(jsInstance);
                }
                catch (error) {
                    promiseToReject && promiseToReject(error);
                }
            };
            this.isJsLoaded = (url) => {
                return this.loadedJSs[url] !== undefined;
            };
            this.getInstance = (url) => {
                return this.routesJSs[url];
            };
            this.fetchJS = (abortController, urls, external) => {
                const init = (url) => {
                    return new Promise(async (resolve, reject) => {
                        // return the instance if this js is already loaded
                        if (external && this.externalJSs[url]) {
                            return resolve(this.externalJSs[url]);
                        }
                        else {
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
                };
                return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
            };
            this.loadServices = (abortController, jsUrl, services) => {
                if (!jsUrl || !services || services.length === 0) {
                    return;
                }
                this.routesJSsServices[jsUrl] = this.routesJSsServices[jsUrl] || [];
                if (services && services.length > 0) {
                    let notFoundServices = [];
                    const servicesUrls = services.map(sn => {
                        const su = this.options.services && this.options.services[sn];
                        if (su === undefined) {
                            notFoundServices.push(sn);
                        }
                        else {
                            this.routesJSsServices[jsUrl].indexOf(sn) === -1 && this.routesJSsServices[jsUrl].push(sn);
                            this.dependencyJSsMap[su] = Object.assign(Object.assign({}, this.dependencyJSsMap[su] || {}), { [jsUrl]: true });
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
            this.initJS = async (jsUrl, params) => {
                const jsInstance = this.getInstance(jsUrl);
                jsInstance && jsInstance.init &&
                    await jsInstance.init(params);
            };
            this.reloadJs = (filePath, jsCode, routeList, currentJS, callback) => {
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
        init(_domFunctions, _navimiFetch, _navimiTemplates, _navimiState, _options) {
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
    }
    __Navimi.Navimi_JSs = Navimi_JSs;
})(__Navimi || (__Navimi = {}));
var __Navimi;
(function (__Navimi) {
    class Navimi_Middleware {
        constructor() {
            this.middlewareStack = [];
            this.addMiddlewares = (middlewares) => {
                if (Array.isArray(middlewares)) {
                    this.middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
                }
            };
            this.executeMiddlewares = async (abortController, context, callback) => {
                let prevIndex = -1;
                const runner = async (resolve, reject, index = 0) => {
                    if (__NAVIMI_DEV) {
                        if (index === prevIndex) {
                            console.warn('next() called multiple times');
                        }
                    }
                    prevIndex = index;
                    const middleware = this.middlewareStack[index];
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
        }
    }
    __Navimi.Navimi_Middleware = Navimi_Middleware;
})(__Navimi || (__Navimi = {}));
class Navimi {
    constructor(routes, options) {
        const navimiFetch = new __Navimi.Navimi_Fetch();
        const navimiDom = new __Navimi.Navimi_Dom();
        const navimiCss = new __Navimi.Navimi_CSSs();
        const navimiJs = new __Navimi.Navimi_JSs();
        const navimiTemplates = new __Navimi.Navimi_Templates();
        const navimiMiddleware = new __Navimi.Navimi_Middleware();
        const navimiState = new __Navimi.Navimi_State();
        navimiFetch.init(options);
        navimiCss.init(navimiDom, navimiFetch);
        navimiDom.init(navimiCss, navimiJs);
        navimiJs.init(navimiDom, navimiFetch, navimiTemplates, navimiState, options);
        navimiTemplates.init(navimiFetch);
        const navimi = new __Navimi.Navimi_Core(routes, options, {
            navimiFetch,
            navimiJs,
            navimiCss,
            navimiDom,
            navimiTemplates,
            navimiMiddleware,
            navimiState
        });
        return navimi;
    }
}
var __Navimi;
(function (__Navimi) {
    class Navimi_State {
        constructor() {
            this.state = {};
            this.stateWatchers = {};
            this.prevState = {};
            this.stateDiff = {};
            this.getStateDiff = (keys) => {
                keys.sort((a, b) => b.length - a.length).map(key => {
                    if (!this.stateDiff[key]) {
                        const sOld = __Navimi_Helpers.stringify(this.getState(key, this.prevState) || "");
                        const sNew = __Navimi_Helpers.stringify(this.getState(key, this.state) || "");
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
            this.invokeStateWatchers = __Navimi_Helpers.debounce(() => {
                const keys = Object.keys(this.stateWatchers);
                const diff = Object.keys(this.stateDiff);
                this.stateDiff = {};
                keys.filter(key => diff.includes(key)).sort((a, b) => b.length - a.length).map(key => {
                    Object.keys(this.stateWatchers[key]).map((cs) => {
                        const sNew = this.getState(key);
                        this.stateWatchers[key][cs] &&
                            this.stateWatchers[key][cs].map((cb) => cb && cb(sNew));
                    });
                });
            }, 10);
            this.mergeState = (state, newState) => {
                if (newState instanceof Error) {
                    newState = Object.assign(Object.assign({}, newState), { message: newState.message, stack: newState.stack });
                }
                const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
                if (isObject(state) && isObject(newState)) {
                    for (const key in newState) {
                        if (isObject(newState[key])) {
                            !state[key] && Object.assign(state, { [key]: {} });
                            this.mergeState(state[key], newState[key]);
                        }
                        else {
                            Object.assign(state, { [key]: newState[key] });
                        }
                    }
                }
            };
            this.setState = (newState) => {
                const observedKeys = Object.keys(this.stateWatchers);
                if (observedKeys.length > 0) {
                    this.prevState = __Navimi_Helpers.cloneObject(this.state);
                }
                this.mergeState(this.state, newState);
                if (observedKeys.length > 0) {
                    this.getStateDiff(observedKeys);
                    this.invokeStateWatchers();
                }
            };
            this.getState = (key, _state) => {
                const st = key ?
                    key.split('.').reduce((v, k) => (v && v[k]) || undefined, _state || this.state) :
                    _state || this.state;
                return st ? Object.freeze(__Navimi_Helpers.cloneObject(st)) : undefined;
            };
            this.watchState = (jsUrl, key, callback) => {
                if (!key || !callback) {
                    return;
                }
                if (!this.stateWatchers[key]) {
                    this.stateWatchers[key] = {};
                }
                this.stateWatchers[key] = Object.assign(Object.assign({}, this.stateWatchers[key]), { [jsUrl]: [
                        ...(this.stateWatchers[key][jsUrl] || []),
                        callback
                    ] });
            };
            this.unwatchState = (jsUrl, key) => {
                const remove = (key) => {
                    this.stateWatchers[key][jsUrl] = undefined;
                    delete this.stateWatchers[key][jsUrl];
                    Object.keys(this.stateWatchers[key]).length === 0 &&
                        delete this.stateWatchers[key];
                };
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
        }
    }
    __Navimi.Navimi_State = Navimi_State;
})(__Navimi || (__Navimi = {}));
var __Navimi;
(function (__Navimi) {
    class Navimi_Templates {
        constructor() {
            this.templatesCache = {};
            this.loadedTemplates = {};
            this.dependencyTemplatesMap = {};
            this.navimiFetch = {};
            this.loadTemplate = (templateCode, url) => {
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
            this.isTemplateLoaded = (url) => {
                return this.loadedTemplates[url] !== undefined;
            };
            this.getTemplate = (templateId) => {
                const ids = Array.isArray(templateId) ? templateId : [templateId];
                const arrTemplates = ids.map(id => this.templatesCache[id]);
                return arrTemplates.length > 1 ? arrTemplates : arrTemplates[0];
            };
            this.fetchTemplate = (abortController, urls, jsUrl) => {
                const init = (url) => {
                    return new Promise(async (resolve, reject) => {
                        if (!url || this.loadedTemplates[url]) {
                            return resolve();
                        }
                        try {
                            const templateCode = await this.navimiFetch.fetchFile(url, {
                                headers: {
                                    Accept: "text/html"
                                },
                                signal: abortController ? abortController.signal : undefined
                            });
                            this.loadTemplate(templateCode, url);
                            this.loadedTemplates[url] = true;
                            resolve();
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    });
                };
                if (jsUrl) {
                    urls.map((u) => {
                        this.dependencyTemplatesMap[u] = Object.assign(Object.assign({}, this.dependencyTemplatesMap[u] || {}), { [jsUrl]: true });
                    });
                }
                return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
            };
            this.reloadTemplate = (filePath, templateCode, routeList, currentJS, globalTemplatesUrl, callback) => {
                const isSameFile = __Navimi_Helpers.isSameFile;
                if (isSameFile(globalTemplatesUrl, filePath)) {
                    console.log(`${filePath} updated.`);
                    this.loadTemplate(templateCode, globalTemplatesUrl);
                    callback();
                    return;
                }
                for (const routeUrl in routeList) {
                    const { jsUrl, templatesUrl } = routeList[routeUrl];
                    if (isSameFile(templatesUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        this.loadTemplate(templateCode, templatesUrl);
                        currentJS === jsUrl && callback();
                        return;
                    }
                }
                for (const templatesUrl in this.dependencyTemplatesMap) {
                    if (isSameFile(templatesUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        this.loadTemplate(templateCode, templatesUrl);
                        Object.keys(this.dependencyTemplatesMap[templatesUrl]).map(s => {
                            if (s === currentJS) {
                                //reload route if current JS is updated
                                callback();
                            }
                        });
                    }
                }
            };
        }
        init(_navimiFetch) {
            this.navimiFetch = _navimiFetch;
        }
    }
    __Navimi.Navimi_Templates = Navimi_Templates;
})(__Navimi || (__Navimi = {}));
