class __Navimi_Hot implements INavimi_Hot {
    //removeIf(minify)
    private _wsHotClient: WebSocket;
    private _navimiCSSs: INavimi_CSSs;
    private _navimiJSs: INavimi_JSs;
    private _navimiTemplates: INavimi_Templates;
    private _initRouteFunc: Function;

    public init(navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs, navimiTemplates: INavimi_Templates, initRoute: Function): void {
        this._navimiCSSs = navimiCSSs;
        this._navimiJSs = navimiJSs;
        this._navimiTemplates = navimiTemplates;
        this._initRouteFunc = initRoute;
    }

    public openHotWs = (hotOption: number | boolean): void => {
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
                    const payload: hotPayload = JSON.parse(e.data || "");
                    if (payload.message) {
                        console.warn(payload.message);
                        return;
                    }
                    if (payload.filePath) {
                        this._digestHot(payload);
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
    };

    private _digestHot = (payload: hotPayload): void => {

        try {
            const filePath = payload.filePath.replace(/\\/g, "/");
            const fileType = filePath.split(".").pop()?.toLocaleLowerCase();
            const data = payload?.data;

            switch (fileType) {
                case "css":
                    this._navimiCSSs.reloadCss(filePath, data);
                    break;

                case "html":
                case "htm":
                    this._navimiTemplates.reloadTemplate(filePath, data, this._initRouteFunc);
                    break;

                case "js":
                    this._navimiJSs.reloadJs(filePath, data, this._initRouteFunc);
                    break;

                case "gif":
                case "jpg":
                case "jpeg":
                case "png":
                case "svg":
                    this._initRouteFunc();
                    break;
            }
        } catch (ex) {
            console.error("Could not digest HOT payload: ", ex);
        }
    };
    //endRemoveIf(minify)
}

//removeIf(dist)
module.exports.hot = __Navimi_Hot;
//endRemoveIf(dist)
