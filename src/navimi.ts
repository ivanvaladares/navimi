/*! 
 * Navimi v0.1.1
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com
 * https://github.com/ivanvaladares/navimi
 */

class Navimi {

    private callId: number;
    private abortController: AbortController;
    private currentJS: string;
    private currentUrl: string;
    private routesParams: { [url: string]: any };
    private routesList: { [url: string]: Route };
    private options: Options;
    private win: any;

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
    constructor(routes: { [url: string]: Route }, options?: Options) {

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
            setTimeout(__Navimi_Hot.openHotWs, 1000, this.options.hot, this.digestHot);
        }
    }

    private navigateTo = (url: string, params?: { [key: string]: any }): void => {
        this.initRoute(url, params);
    };

    private reportError = (error: Error): void => {
        if (this.options.onError) {
            this.options.onError(error);
            return;
        }
        console.error(error);
    }

    private digestHot = (payload: hotPayload): void => {

        const isSameFile = (path1: string, path2: string) => {
            return path1 && path2 && path1.split("?").shift().toLowerCase() ==
                path2.split("?").shift().toLowerCase();
        }

        const isCurrrentRouteAsset = (path: string, key: string) => {
            for (const routeUrl in this.routesList) {
                const routeItem = this.routesList[routeUrl];
                //@ts-ignore
                if (isSameFile(routeItem[key], path) && routeItem.jsUrl === this.currentJS) {
                    return true;
                }
            }
        }

        try {
            const filePath = payload.filePath.replace(/\\/g, "/");
            const fileType = filePath.split(".").pop();
            const data = payload.data;

            if (fileType === "css") {
                const isGlobalCss = isSameFile(this.options.globalCssUrl, filePath);
                const isCurrentRouteCss = isCurrrentRouteAsset(filePath, "cssUrl");              

                __Navimi_CSSs.loadCss(filePath, data);
                
                if (isGlobalCss || isCurrentRouteCss) {
                    __Navimi_Dom.insertCss(data, isGlobalCss ? "globalCss" : "routeCss");
                    console.warn(`${filePath} updated.`);
                }

                return;
            }

            if (fileType === "html" || fileType === "htm") {
                const isGlobalTemplate = isSameFile(this.options.globalTemplatesUrl, filePath);
                const isDependentTemplate = __Navimi_JSs.isDependent(filePath, this.currentJS);
                const isCurrentRouteTemplate = isCurrrentRouteAsset(filePath, "templatesUrl");

                __Navimi_Templates.loadTemplate(data, filePath);

                if (isGlobalTemplate || isDependentTemplate || isCurrentRouteTemplate) {
                    this.initRoute(undefined, this.routesParams[this.currentJS], true);
                    console.warn(`${filePath} updated.`);
                }

                return;
            }

            if (fileType === "js") {
                const isDependentJS = __Navimi_JSs.isDependent(filePath, this.currentJS);
                const isCurrentRouteJS = isCurrrentRouteAsset(filePath, "jsUrl");

                //todo: fix this to accept files that are not the current route or related to it

                if (isDependentJS || isCurrentRouteJS) {

                    if (isDependentJS) {
                        __Navimi_JSs.unloadJs(filePath, data, false, this.currentJS, () => {
                            this.initRoute(undefined, this.routesParams[this.currentJS], true);
                        });
                    }

                    if (isCurrentRouteJS) {
                        __Navimi_JSs.unloadJs(this.currentJS, data, true, this.currentJS, () => {
                            __Navimi_JSs.initJS(this.currentJS, this.routesParams[this.currentJS]);
                        });
                    }
                    
                    console.warn(`${filePath} updated.`);
                }

            }            

        } catch (ex) {
            console.error("Could not digest HOT payload: ", ex);
        }
    };

    private initRoute = async (urlToGo?: string, navParams?: { [key: string]: any }, force?: boolean): Promise<void> => {
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

        await __Navimi_Middleware.executeMiddlewares(this.abortController, { url, routeItem, params }, (url: string, params: any) => {
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
                if (navParams?.replaceUrl) {
                    history.replaceState(null, null, urlToGo);
                } else {
                    history.pushState(null, null, urlToGo);
                }
            }

            __Navimi_CSSs.fetchCss(this.abortController, cssUrl).catch(_ => { }); //todo: should report error?
            __Navimi_Templates.fetchTemplate(this.abortController, [templatesUrl]).catch(_ => { }); //todo: should report error?
            try {
                __Navimi_JSs.loadServices(this.abortController, jsUrl, dependsOn); //todo: should report error?
            } catch (ex) {
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
                if ((cssUrl && __Navimi_Fetch.loadErrors[cssUrl]) ||
                    (templatesUrl && __Navimi_Fetch.loadErrors[templatesUrl]) ||
                    (this.options.globalCssUrl &&
                        __Navimi_Fetch.loadErrors[this.options.globalCssUrl]) ||
                    (this.options.globalTemplatesUrl &&
                        __Navimi_Fetch.loadErrors[this.options.globalTemplatesUrl])) {
                    this.reportError(
                        new Error(
                            __Navimi_Fetch.loadErrors[cssUrl] ||
                            __Navimi_Fetch.loadErrors[templatesUrl] ||
                            __Navimi_Fetch.loadErrors[this.options.globalCssUrl] ||
                            __Navimi_Fetch.loadErrors[this.options.globalTemplatesUrl]
                        )
                    );
                    return;
                }
            }

            __Navimi_Dom.setTitle(title);

            try {

                if (jsUrl) {
                    await __Navimi_JSs.initJS(jsUrl, this.routesParams[jsUrl]);
                } else {
                    const template = __Navimi_Templates.getTemplate(templatesUrl) as string;
                    const body = document.querySelector("body");
                    if (template && body) {
                        body.innerHTML = template;
                    }
                    return;
                }

            } catch (ex) {
                this.reportError(ex);

            } finally {

                if (callId < this.callId) {
                    return;
                }
    
                __Navimi_Dom.setNavimiLinks(this.navigateTo);
                
                __Navimi_Dom.insertCss(__Navimi_CSSs.getCss(cssUrl), "routeCss");
    
                this.options.onAfterRoute &&
                    this.options.onAfterRoute({ url, routeItem, params }, this.navigateTo);
            }

        } catch (ex) {
            this.reportError(ex);
        }
        
    };

}