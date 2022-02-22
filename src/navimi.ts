class Navimi {

    private callId: number;
    private abortController: AbortController;
    private currentJS: string;
    private currentUrl: string;
    private routesParams: KeyList<any>;
    private routesList: KeyList<Route>;
    private options: Options;
    private win: any;

    constructor(routes: KeyList<Route>, options?: Options) {

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
                setTimeout(__Navimi_Hot.openHotWs, 1000, this.options.hot, 
                    (callback: (globalCssUrl: string, 
                        globalTemplatesUrl: string, 
                        currentJs: string, 
                        routesList: KeyList<Route>,
                        initRoute: any) => void) => {

                        callback(this.options.globalCssUrl, 
                            this.options.globalTemplatesUrl, 
                            this.currentJS, 
                            this.routesList, () => {
                            this.initRoute(undefined, this.routesParams[this.currentJS], true);
                        });
                    });
            }
        }
    }

    private navigateTo = (url: string, params?: KeyList<any>): void => {
        this.initRoute(url, params);
    };

    private reportError = (error: Error): void => {
        if (this.options.onError) {
            this.options.onError(error);
            return;
        }
        console.error(error);
    }

    private initRoute = async (urlToGo?: string, navParams?: KeyList<any>, force?: boolean): Promise<void> => {
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

            __Navimi_CSSs.fetchCss(this.abortController, cssUrl).catch(_ => { });
            __Navimi_Templates.fetchTemplate(this.abortController, [templatesUrl]).catch(_ => { });
            try {
                __Navimi_JSs.loadServices(this.abortController, jsUrl, dependsOn);
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

                //check if any load error occured
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