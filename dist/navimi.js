/*!
 * Navimi v0.2.0
 * Developed by Ivan Valadares
 * ivanvaladares@hotmail.com
 * https://github.com/ivanvaladares/navimi
 */
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
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onAfterRoute - A function invoked after the routing is done
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onBeforeRoute - A function invoked before middlewares and routing
    * @param {function(Error): void=} options.onError - A function to capture erros from routes
    * @returns {Object} - The Navimi instance
    */
    constructor(routes, options) {
        this.timeout = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        this.debounce = (task, ms) => {
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
        this.setNavimiLinks = () => {
            document.querySelectorAll("[navimi-link]").forEach(el => {
                el.removeAttribute("navimi-link");
                el.setAttribute("navimi-linked", "");
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo(e.target.pathname);
                });
            });
        };
        this.navigateTo = (url, params) => {
            this.initRoute(url, params);
        };
        this.setTitle = (title) => {
            document.title = title;
        };
        this.getUrl = () => {
            const location = document.location;
            const matches = location.toString().match(/^[^#]*(#.+)$/);
            const hash = matches ? matches[1] : "";
            return [location.pathname, location.search, hash].join("");
        };
        this.splitPath = (path) => {
            if (!path) {
                return [];
            }
            const queryPos = path.indexOf("?");
            path = queryPos >= 0 ? path.substr(0, queryPos) : path;
            return path.split("/").filter(p => p.length > 0);
        };
        this.removeHash = (url) => {
            const hashPos = url.indexOf("#");
            return hashPos > 0 ? url.substr(0, hashPos) : url;
        };
        this.parseQuery = (queryString) => {
            const query = {};
            queryString.split('&').map(pair => {
                const kv = pair.split('=');
                query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
            });
            return query;
        };
        this.parsePath = (urlPath, urlPattern) => {
            const queryPos = urlPath.indexOf("?");
            const query = queryPos > 0 ? urlPath.substr(queryPos + 1, urlPath.length) : "";
            const path = this.splitPath(urlPath);
            const pattern = this.splitPath(urlPattern);
            let params = {};
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
        this.stringify = (obj) => {
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
                            catch (err) {
                                return err.message;
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
        this.cloneObject = (obj) => {
            var ot = Array.isArray(obj);
            return obj === null || typeof obj !== "object" ? obj :
                Object.keys(obj).reduce((prev, current) => obj[current] !== null && typeof obj[current] === "object" ?
                    (prev[current] = this.cloneObject(obj[current]), prev) :
                    (prev[current] = obj[current], prev), ot ? [] : {});
        };
        this.getStateDiff = (keys) => {
            keys.sort((a, b) => b.length - a.length).map(key => {
                if (!this.stateDiff[key]) {
                    const sOld = this.stringify(this.getState(key, this.prevState) || "");
                    const sNew = this.stringify(this.getState(key, this.state) || "");
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
        this.invokeStateWatchers = this.debounce(() => {
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
        this.setState = (newState) => {
            const observedKeys = Object.keys(this.stateWatchers);
            if (observedKeys.length > 0) {
                this.prevState = this.cloneObject(this.state);
            }
            this.mergeState(this.state, newState);
            if (observedKeys.length > 0) {
                this.getStateDiff(observedKeys);
                this.invokeStateWatchers();
            }
        };
        this.getState = (key, state) => {
            const st = key ?
                key.split('.').reduce((v, k) => (v && v[k]) || undefined, state || this.state) :
                state || this.state;
            return st ? Object.freeze(this.cloneObject(st)) : undefined;
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
        this.reportError = (error) => {
            if (this.options.onError) {
                this.options.onError(error);
                return;
            }
            throw error;
        };
        this.openHotWs = (hotOption) => {
            try {
                console.log("Connecting HOT...");
                const port = hotOption === true ? 8080 : hotOption;
                this.wsHotClient = null;
                this.wsHotClient = new WebSocket(`ws://localhost:${port}`);
                this.wsHotClient.addEventListener('message', (e) => {
                    try {
                        const json = JSON.parse(e.data || "");
                        if (json.message) {
                            console.log(json.message);
                            return;
                        }
                        if (json.filePath) {
                            this.digestHot(json);
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
        };
        this.digestHot = (file) => {
            const isSameFile = (path1, path2) => {
                return path1 && path2 && path1.split("?").shift().toLocaleLowerCase() ==
                    path2.split("?").shift().toLocaleLowerCase();
            };
            try {
                const filePath = file.filePath.replace(/\\/g, "/");
                const pages = this.win[this.pagesNamespace];
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
                        (this.currentJS && this.currentJS === routeItem.jsUrl ||
                            routeItem.templatesUrl === this.currentRouteItem.templatesUrl) &&
                            this.initJS(this.currentJS);
                        this.setNavimiLinks();
                        return;
                    }
                }
            }
            catch (ex) {
                console.error("Could not digest HOT message: ", ex);
            }
        };
        this.fetchFile = (url, options) => {
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
        this.parseTemplate = (templateCode, url) => {
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
        this.fetchTemplate = (isCancelable, urls) => {
            const init = (url) => {
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
                    }
                    catch (ex) {
                        reject(ex);
                    }
                });
            };
            return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
        };
        this.fetchCss = (url, isGlobal, autoInsert) => {
            return new Promise(async (resolve, reject) => {
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
        this.fetchJS = (url, external) => {
            return new Promise(async (resolve, reject) => {
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
                }
                catch (ex) {
                    reject(ex);
                }
            });
        };
        this.addLibrary = async (jsOrCssUrl) => {
            let urls = Array.isArray(jsOrCssUrl) ? jsOrCssUrl : [jsOrCssUrl];
            urls = urls.filter(url => !this.loadedJs[url]);
            urls.length > 0 && await Promise.all(urls.map(url => {
                const type = url.split(".").pop();
                if (type.toLocaleLowerCase() === "css") {
                    return this.fetchCss(url, false, true);
                }
                return this.fetchJS(url);
            })).catch(ex => {
                throw new Error(ex);
            });
            return;
        };
        this.insertCss = (cssCode, type, prepend) => {
            const oldTag = type ? document.querySelector(`[${type}]`) : undefined;
            oldTag && oldTag.remove();
            if (!cssCode) {
                return;
            }
            const style = document.createElement("style");
            style.innerHTML = cssCode;
            type && style.setAttribute(type, "");
            const head = document.getElementsByTagName("head")[0];
            const target = (head || document.body);
            prepend ? target.prepend(style) : target.appendChild(style);
        };
        this.insertJS = (jsCode, jsUrl, external) => {
            const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
            oldTag && oldTag.remove();
            let jsHtmlBody = external !== undefined ?
                `(function(){window.${this.pagesNamespace}.${this.pagesMainCallBack}("${jsUrl}", ${external}, (function(){return ${jsCode}   
    })())}())` : jsCode;
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.innerHTML = jsHtmlBody;
            script.setAttribute("jsUrl", jsUrl);
            const head = document.getElementsByTagName("head")[0];
            (head || document.body).appendChild(script);
        };
        this.getTemplate = (templateId) => {
            const ids = Array.isArray(templateId) ? templateId : [templateId];
            const arrTemplates = ids.map(id => this.templatesCache[id]);
            return arrTemplates.length > 1 ? arrTemplates : arrTemplates[0];
        };
        this.executeMiddlewares = async (context, callId) => {
            let prevIndex = -1;
            const runner = async (index, resolve, reject) => {
                if (index === prevIndex) {
                    throw new Error('next() called multiple times');
                }
                prevIndex = index;
                const middleware = this.middlewareStack[index];
                if (middleware) {
                    await middleware(context, (url, params) => {
                        if (callId === this.callId) {
                            if (!url) {
                                runner(index + 1, resolve, reject);
                            }
                            else {
                                reject();
                                this.initRoute(url, params, true);
                            }
                        }
                    });
                }
                else {
                    resolve();
                }
            };
            await new Promise(async (resolve, reject) => {
                await runner(0, resolve, reject);
            });
        };
        this.setupRoute = async (routeItem) => {
            const pages = this.win[this.pagesNamespace];
            const instantiateJS = async (jsUrl, external, JsClass) => {
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
                    fetchJS: (url) => {
                        const urls = Array.isArray(url) ? url : [url];
                        urls.map(u => {
                            this.externalJSsMap[u] = Object.assign(Object.assign({}, this.externalJSsMap[u] || {}), { [jsUrl]: true });
                        });
                        return fetchJS(true, urls);
                    },
                    fetchTemplate: (url) => {
                        const urls = Array.isArray(url) ? url : [url];
                        urls.map((u) => {
                            this.externalTemplatesMap[u] = Object.assign(Object.assign({}, this.externalTemplatesMap[u] || {}), { [jsUrl]: true });
                        });
                        return this.fetchTemplate(true, urls);
                    },
                    setState: this.setState,
                    getState: this.getState,
                    setNavimiLinks: this.setNavimiLinks,
                    unwatchState: (key) => this.unwatchState(jsUrl, key),
                    watchState: (key, callback) => this.watchState(jsUrl, key, callback),
                });
                let services;
                if (this.routesJSsServices[jsUrl].length > 0) {
                    while (true) {
                        if (this.routesJSsServices[jsUrl].map((sn) => this.externalJSs[this.options.services[sn]] === undefined).indexOf(true) === -1) {
                            break;
                        }
                        if (this.routesJSsServices[jsUrl].map(sn => this.options.services[sn]).find(su => this.loadErrors[su])) {
                            return;
                        }
                        await this.timeout(10);
                    }
                    this.routesJSsServices[jsUrl].map((sn) => {
                        services = Object.assign(Object.assign({}, services), { [sn]: this.externalJSs[this.options.services[sn]] });
                    });
                }
                try {
                    this.unwatchState(jsUrl);
                    let jsInstance = new JsClass(routerFunctions, services);
                    //keep this instance to reuse later
                    this.routesJSs[jsUrl] = jsInstance;
                    return jsInstance;
                }
                catch (error) {
                    pages[this.callbackNS + jsUrl + "_reject"](error);
                }
            };
            const awaitJS = (jsUrl) => {
                return new Promise((resolve, reject) => {
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
            const fetchJS = (external, urls) => {
                const init = (url) => {
                    return new Promise(async (resolve, reject) => {
                        // return the instance if this js is already loaded
                        if (external) {
                            if (this.externalJSs[url]) {
                                return resolve(this.externalJSs[url]);
                            }
                        }
                        else {
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
                };
                return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
            };
            // setup main callback
            if (!pages[this.pagesMainCallBack]) {
                // create the function to be called from the loaded js
                pages[this.pagesMainCallBack] = (jsUrl, external, JsClass) => {
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
                let notFoundServices = [];
                const servicesUrls = dependsOn.map(sn => {
                    const su = this.options.services && this.options.services[sn];
                    if (su === undefined) {
                        notFoundServices.push(sn);
                    }
                    else {
                        this.routesJSsServices[jsUrl].indexOf(sn) === -1 &&
                            this.routesJSsServices[jsUrl].push(sn);
                        this.externalJSsMap[su] = Object.assign(Object.assign({}, this.externalJSsMap[su] || {}), { [jsUrl]: true });
                    }
                    return su;
                });
                if (notFoundServices.length > 0) {
                    this.reportError(new Error("Service(s) not defined: " + notFoundServices.join(", ")));
                    return;
                }
                Promise.all(servicesUrls.filter(su => su !== undefined)
                    .map(su => fetchJS(true, [su])))
                    .catch(this.reportError);
            }
            return fetchJS(false, [jsUrl]);
        };
        this.initRoute = async (urlToGo, navParams, force) => {
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
                params = Object.assign(Object.assign({}, params), navParams);
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
                callId === this.callId && this.reportError(new Error("No route match for url: " + url));
                return;
            }
            try {
                await this.executeMiddlewares({ url, routeItem, params }, callId);
            }
            catch (_a) {
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
                    if (navParams === null || navParams === void 0 ? void 0 : navParams.replaceUrl) {
                        history.replaceState(null, null, urlToGo);
                    }
                    else {
                        history.pushState(null, null, urlToGo);
                    }
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
                        this.reportError(new Error(this.loadErrors[cssUrl] ||
                            this.loadErrors[templatesUrl] ||
                            this.loadErrors[this.options.globalCssUrl] ||
                            this.loadErrors[this.options.globalTemplatesUrl]));
                        return;
                    }
                }
                this.setTitle(title);
                try {
                    await this.initJS(jsUrl);
                }
                catch (ex) {
                    this.reportError(ex);
                }
                finally {
                    if (callId < this.callId) {
                        return;
                    }
                    this.setNavimiLinks();
                    this.insertCss(this.loadedCsss[cssUrl], "pageCss");
                    this.options.onAfterRoute &&
                        this.options.onAfterRoute({ url, routeItem, params }, this.navigateTo);
                }
            }
            catch (ex) {
                callId === this.callId && this.reportError(ex);
            }
        };
        this.initJS = async (jsUrl) => {
            if (!jsUrl) {
                const url = this.currentRouteItem ? this.currentRouteItem.templatesUrl : null;
                const template = this.getTemplate(url);
                const body = document.querySelector("body");
                if (template && body) {
                    body.innerHTML = template;
                }
                return;
            }
            this.routesJSs[jsUrl] && this.routesJSs[jsUrl].init &&
                await this.routesJSs[jsUrl].init(this.currentParams[jsUrl]);
        };
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
    mergeState(state, newState) {
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
    }
}
class NavimiRoute {
    /**
    * @typedef {Object} Functions - A collection of functions
    * @property {string} functions.title - The title that will be displayed on the browser
    * @property {string} functions.jsUrl - The path to the route script
    * @property {string=} functions.cssUrl - The path to the route css
    * @property {string=} functions.templatesUrl - The path to the templates file of this route
    * @property {string[]=} functions.dependsOn - An array of services names for this route
    * @property {Object.<string, *>=} functions.metadata - Any literal you need to pass down to this route and middlewares
    * @param {Object[]} services - A collection of services
    * @returns {Object} - The Navimi route
    */
    constructor(functions, services) {
    }
    /**
    * @typedef {Object} RouterFunctions - A collection of functions
    * @param {Object[]} services - A collection of services
    */
    init(context) {
    }
    ;
    /**
    * @typedef {Object} functions - A collection of functions
    * @param {Object[]} services - A collection of services
    * @returns {boolean} - False if you need to keep the user on this page
    */
    beforeLeave(context) {
    }
    /**
    * @typedef {Object} functions - A collection of functions
    * @param {Object[]} services - A collection of services
    * @returns {boolean} - False if you need to keep the user on this page
    */
    destroy() {
    }
}

//# sourceMappingURL=navimi.js.map
