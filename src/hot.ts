class __Navimi_Hot implements INavimi_Hot {

    private _wsHotClient: WebSocket;
    private _navimiCSSs: INavimi_CSSs;
    private _navimiJSs: INavimi_JSs;
    private _navimiTemplates: INavimi_Templates;

    public init(navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs, navimiTemplates: INavimi_Templates) {
        this._navimiCSSs = navimiCSSs;
        this._navimiJSs = navimiJSs;
        this._navimiTemplates = navimiTemplates;
    }

    public openHotWs = (hotOption: number | boolean, callback: any): void => {
        if (__NAVIMI_DEV) {
            try {
                if (!('WebSocket' in window)) {
                    console.error("Websocket is not supported by your browser!");
                    return;
                }

                console.warn("Connecting HOT...");
                const port = hotOption === true ? 8080 : hotOption;
                this._wsHotClient = null;
                this._wsHotClient = new WebSocket(`ws://localhost:${port}`);
                this._wsHotClient.addEventListener('message', (e: any) => {
                    try {
                        const json: hotPayload = JSON.parse(e.data || "");
                        if (json.message) {
                            console.warn(json.message);
                            return;
                        }
                        if (json.filePath) {
                            callback((globalCssUrl: string,
                                globalTemplatesUrl: string,
                                currentJs: string,
                                routesList: INavimi_KeyList<INavimi_Route>,
                                initRoute: any) => {

                                this._digestHot(json,
                                    globalCssUrl,
                                    globalTemplatesUrl,
                                    currentJs,
                                    routesList,
                                    initRoute);
                            });
                        }
                    } catch (ex) {
                        console.error("Could not parse HOT message:", ex);
                    }
                });
                this._wsHotClient.onclose = () => {
                    console.warn('HOT Connection Closed!');
                    setTimeout(this.openHotWs, 5000, hotOption);
                };
            } catch (ex) {
                console.error(ex);
            }
        }
    };

    private _digestHot = (payload: hotPayload,
        globalCssUrl: string,
        globalTemplatesUrl: string,
        currentJs: string,
        routesList: INavimi_KeyList<INavimi_Route>,
        initRoute: any): void => {

        if (__NAVIMI_DEV) {
            try {
                const filePath = payload.filePath.replace(/\\/g, "/");
                const fileType = filePath.split(".").pop();
                const data = payload.data;

                switch (fileType) {
                    case "css":
                        this._navimiCSSs.reloadCss(filePath, data, routesList, currentJs, globalCssUrl);
                        break;

                    case "html":
                    case "htm":
                        this._navimiTemplates.reloadTemplate(filePath, data, routesList, currentJs, globalTemplatesUrl, () => {
                            initRoute();
                        });
                        break;

                    case "js":
                        this._navimiJSs.reloadJs(filePath, data, routesList, currentJs, () => {
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
            } catch (ex) {
                console.error("Could not digest HOT payload: ", ex);
            }
        }

    };
}