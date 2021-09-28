/*!
 * Navimi v0.0.1
 * Developed by Ivan Valadares
 * ivanvaladares@hotmail.com
 * https://github.com/ivanvaladares/navimi
 */
class Navimi {
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
            const path = queryPos > 0 ? this.splitPath(urlPath.substr(0, queryPos)) : this.splitPath(urlPath);
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
                    if (pattern[i].toLocaleLowerCase() !== path[i].toLocaleLowerCase())
                        return null;
                }
            }
            return params;
        };
        this.getStateDiff = (keys) => {
            keys.sort((a, b) => b.length - a.length).map(key => {
                if (!this.stateDiff[key]) {
                    const sOld = JSON.stringify(this.getState(key, this.prevState) || "");
                    const sNew = JSON.stringify(this.getState(key, this.state) || "");
                    if (sOld !== sNew) {
                        this.stateDiff[key] = true;
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
                this.prevState = JSON.parse(JSON.stringify(this.state));
            }
            this.mergeState(newState);
            if (observedKeys.length > 0) {
                this.getStateDiff(observedKeys);
                this.invokeStateWatchers();
            }
        };
        this.getState = (key, state) => {
            const st = key ?
                key.split('.').reduce((v, k) => (v && v[k]) || undefined, state || this.state) :
                state || this.state;
            return st ? Object.freeze(JSON.parse(JSON.stringify(st))) : undefined;
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
                this.options.onError(Error(error));
                return;
            }
            console.error(error);
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
                if (isSameFile(this.options.globalTemplatesUrl, filePath)) {
                    console.log(`${file.filePath} updated.`);
                    this.parseTemplate(file.data);
                    this.initJS(this.currentJS);
                    return;
                }
                if (this.externalJSsMap[filePath]) {
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
                if (this.externalTemplatesMap[filePath]) {
                    console.log(`${file.filePath} updated.`);
                    this.parseTemplate(file.data);
                    Object.keys(this.externalTemplatesMap[filePath])
                        .find(s => s === this.currentJS) &&
                        this.initJS(this.currentJS);
                    return;
                }
                for (const routeUrl in this.routingList) {
                    const routeItem = this.routingList[routeUrl];
                    if (isSameFile(routeItem.jsUrl, filePath)) {
                        if (this.routesJSs[routeItem.jsUrl]) {
                            console.log(`${file.filePath} updated.`);
                            this.routesJSs[routeItem.jsUrl] = undefined;
                            pages[this.callbackNS + routeItem.jsUrl] = () => {
                                this.currentJS === routeItem.jsUrl &&
                                    this.initJS(this.currentJS);
                            };
                            this.insertJS(file.data, routeItem.jsUrl, false);
                        }
                        return;
                    }
                    if (isSameFile(routeItem.cssUrl, filePath)) {
                        console.log(`${file.filePath} updated.`);
                        this.loadedCsss[routeItem.cssUrl] = file.data;
                        this.currentJS === routeItem.jsUrl &&
                            this.insertCss(file.data, "pageCss");
                        return;
                    }
                    if (isSameFile(routeItem.templatesUrl, filePath)) {
                        console.log(`${file.filePath} updated.`);
                        this.parseTemplate(file.data);
                        this.currentJS === routeItem.jsUrl &&
                            this.initJS(this.currentJS);
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
        this.parseTemplate = (templateCode) => {
            const regIni = new RegExp("<t ([^>]+)>");
            const regEnd = new RegExp("</t>");
            const regId = new RegExp("id=\"([^\"]+)\"");
            let tempCode = templateCode;
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
                        this.parseTemplate(templateCode);
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
                        this.loadedCsss[url] = "";
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
                setTimeout(() => {
                    delete pages[this.callbackNS + jsUrl];
                    delete pages[this.callbackNS + jsUrl + "_reject"];
                }, 1000);
                if (external) {
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
                        if (pages[this.callbackNS + url]) {
                            await awaitJS(url)
                                .then(resolve)
                                .catch(reject);
                            return;
                        }
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
            if (!pages[this.pagesMainCallBack]) {
                pages[this.pagesMainCallBack] = (jsUrl, external, JsClass) => {
                    pages[this.callbackNS + jsUrl](instantiateJS(jsUrl, external, JsClass));
                };
            }
            const { jsUrl, cssUrl, templatesUrl, dependsOn } = routeItem;
            this.fetchCss(cssUrl).catch(_ => { });
            this.fetchTemplate(true, [templatesUrl]).catch(_ => { });
            this.routesJSsServices[jsUrl] = this.routesJSsServices[jsUrl] || [];
            if (dependsOn && dependsOn.length > 0) {
                let notFoundServices = [];
                const servicesUrls = dependsOn.map(sn => {
                    const su = this.options.services[sn];
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
                    this.reportError("Service(s) not defined: " + notFoundServices.join(", "));
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
            }
            catch (error) {
                return;
            }
            if (callId < this.callId) {
                return;
            }
            const { title, jsUrl, cssUrl, templatesUrl } = routeItem || {};
            this.currentJS = jsUrl;
            this.currentUrl = url;
            this.currentParams[jsUrl] = { url, routeItem, params };
            if (pushState) {
                history.pushState(null, null, urlToGo);
            }
            try {
                await this.setupRoute(routeItem);
                if (cssUrl || templatesUrl) {
                    while (this.loadedCsss[cssUrl] === undefined ||
                        this.loadedTemplates[templatesUrl] === undefined) {
                        await this.timeout(10);
                        if (callId < this.callId) {
                            return;
                        }
                        if ((!cssUrl || this.loadedCsss[cssUrl] !== undefined) &&
                            (!templatesUrl || this.loadedTemplates[templatesUrl] !== undefined)) {
                            break;
                        }
                        if ((cssUrl && this.loadErrors[cssUrl]) ||
                            (templatesUrl && this.loadErrors[templatesUrl])) {
                            this.reportError(this.loadErrors[cssUrl] || this.loadErrors[templatesUrl]);
                            return;
                        }
                    }
                }
                this.setTitle(title);
                await this.initJS(jsUrl);
                if (callId < this.callId) {
                    return;
                }
                this.insertCss(this.loadedCsss[cssUrl], "pageCss");
            }
            catch (ex) {
                callId === this.callId && this.reportError(ex.message);
            }
        };
        this.initJS = async (jsUrl) => {
            if (!jsUrl) {
                return;
            }
            this.routesJSs[jsUrl] &&
                this.routesJSs[jsUrl].init &&
                await this.routesJSs[jsUrl].init(this.currentParams[jsUrl]);
        };
        this.pagesNamespace = "__spaPages";
        this.pagesMainCallBack = "_mainCallback";
        this.callbackNS = "_callback_";
        this.win = window ? window : {};
        this.controller = new AbortController();
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
        this.win.addEventListener('popstate', () => {
            this.initRoute();
        });
        this.win.navigateTo = this.navigateTo;
        this.win[this.pagesNamespace] = {};
        const middlewares = this.options.middlewares;
        if (Array.isArray(middlewares)) {
            this.middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
        }
        (async () => {
            if (options.globalCssUrl || options.globalTemplatesUrl) {
                await Promise.all([
                    this.fetchCss(options.globalCssUrl, true),
                    this.fetchTemplate(false, [options.globalTemplatesUrl]),
                ]).catch(this.reportError);
                this.insertCss(this.loadedCsss[options.globalCssUrl], "globalCss");
            }
        })();
        this.initRoute();
        if (options.hot && 'WebSocket' in this.win) {
            setTimeout(this.openHotWs, 1000, options.hot);
        }
    }
    mergeState(newState) {
        const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
        if (isObject(this.state) && isObject(newState)) {
            for (const key in newState) {
                if (isObject(newState[key])) {
                    !this.state[key] && Object.assign(this.state, { [key]: {} });
                    this.mergeState(newState[key]);
                }
                else {
                    Object.assign(this.state, { [key]: newState[key] });
                }
            }
        }
    }
}

//# sourceMappingURL=navimi.js.map
