namespace __Navimi {

    export class Navimi_Core {

        private callId: number;
        private abortController: AbortController;
        private currentJS: string;
        private currentUrl: string;
        private routesParams: KeyList<any>;
        private routesList: KeyList<Route>;
        private options: Options;
        private win: any;

        private navimiFetch: __Navimi.Navimi_Fetch;
        private navimiJs: __Navimi.Navimi_JSs;
        private navimiCss: __Navimi.Navimi_CSSs;
        private navimiDom: __Navimi.Navimi_Dom;
        private navimiTemplates: __Navimi.Navimi_Templates;
        private navimiMiddleware: __Navimi.Navimi_Middleware;

        constructor(routes: KeyList<Route>, options?: Options, denpendencies?: any) {

            this.callId = 0;
            this.abortController = new AbortController();
            this.currentJS = undefined;
            this.currentUrl = undefined;
            this.routesParams = {};
            this.routesList = routes || {};
            this.options = options || {};
            this.win = window ? window : {};

            this.navimiFetch = denpendencies.navimiFetch
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

        private async init(): Promise<void> {
            if (this.options.globalCssUrl || this.options.globalTemplatesUrl) {

                await Promise.all([
                    this.navimiCss.fetchCss(undefined, this.options.globalCssUrl),
                    this.navimiTemplates.fetchTemplate(undefined, [this.options.globalTemplatesUrl]),
                ]).catch(this.reportError);

                this.navimiDom.insertCss(this.navimiCss.getCss(this.options.globalCssUrl), "globalCss");
            }
        }

        private initHot() {
            
            if (EXCLUDEHOT) {
                console.warn('HOT is disabled! Use the unminified version to enable it.');
            }
            if (INCLUDEHOT) {
                const hot = new __Navimi.Navimi_hot({
                    reloadCss: this.navimiCss.reloadCss,
                    reloadTemplate: this.navimiTemplates.reloadTemplate,
                    reloadJs: this.navimiJs.reloadJs,
                });

                setTimeout(hot.openHotWs, 1000, this.options.hot,
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

            await this.navimiMiddleware.executeMiddlewares(this.abortController, { url, routeItem, params }, (url: string, params: any) => {
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

                this.navimiCss.fetchCss(this.abortController, cssUrl); //.catch(_ => { });
                this.navimiTemplates.fetchTemplate(this.abortController, [templatesUrl]).catch(_ => { });
                try {
                    this.navimiJs.loadServices(this.abortController, jsUrl, dependsOn);
                } catch (ex) {
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
                        this.reportError(
                            new Error(
                                this.navimiFetch.loadErrors[cssUrl] ||
                                this.navimiFetch.loadErrors[templatesUrl] ||
                                this.navimiFetch.loadErrors[this.options.globalCssUrl] ||
                                this.navimiFetch.loadErrors[this.options.globalTemplatesUrl]
                            )
                        );
                        return;
                    }
                }

                this.navimiDom.setTitle(title);

                try {

                    if (jsUrl) {
                        await this.navimiJs.initJS(jsUrl, this.routesParams[jsUrl]);
                    } else {
                        const template = this.navimiTemplates.getTemplate(templatesUrl) as string;
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

                    this.navimiDom.setNavimiLinks();

                    this.navimiDom.insertCss(this.navimiCss.getCss(cssUrl), "routeCss");

                    this.options.onAfterRoute &&
                        this.options.onAfterRoute({ url, routeItem, params }, this.navigateTo);
                }

            } catch (ex) {
                this.reportError(ex);
            }

        };

    }

}