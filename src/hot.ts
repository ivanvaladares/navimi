class __Navimi_Hot implements INavimi_Hot {
    //removeIf(minify)
    private _wsHotClient: WebSocket;
    private _navimiCSSs: INavimi_CSSs;
    private _navimiJSs: INavimi_JSs;
    private _navimiTemplates: INavimi_Templates;
    // eslint-disable-next-line @typescript-eslint/ban-types
    private _initRouteFunc: Function;

    // eslint-disable-next-line @typescript-eslint/ban-types
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
            this._wsHotClient.addEventListener('message', async (e: any) => {
                try {
                    const payload: hotPayload = JSON.parse(e.data || "");
                    if (payload.message) {
                        console.warn(payload.message);
                        return;
                    }
                    if (payload.filePath) {
                        await this._digestHot(payload);
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

    private _digestHot = async (payload: hotPayload): Promise<void> => {
        try {
            payload.filePath = payload.filePath.replace(/\\/g, "/");
            const fileType = payload.filePath.split(".").pop()?.toLocaleLowerCase();

            switch (fileType) {
                case "css":
                    await this._navimiCSSs.digestHot(payload)
                    .catch(e => {/*ignore*/});
                    break;

                case "html":
                case "htm":
                    await this._navimiTemplates.digestHot(payload)
                        .then(() => this._initRouteFunc())
                        .catch(e => {/*ignore*/});
                    break;

                case "js":
                    this._navimiJSs.digestHot(payload)
                    .then(() => this._initRouteFunc())
                    .catch(e => {/*ignore*/});
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
