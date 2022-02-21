namespace __Navimi_Hot {
    let wsHotClient: WebSocket;

    export const openHotWs = (hotOption: number | boolean, callback: any): void => {
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
                wsHotClient.addEventListener('message', (e: any) => {
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
                                routesList: KeyList<Route>,
                                initRoute: any) => {

                                digestHot(json,
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
                wsHotClient.onclose = () => {
                    console.warn('HOT Connection Closed!');
                    setTimeout(openHotWs, 5000, hotOption);
                };
            } catch (ex) {
                console.error(ex);
            }
        }
    };

    const digestHot = (payload: hotPayload,
        globalCssUrl: string,
        globalTemplatesUrl: string,
        currentJs: string,
        routesList: KeyList<Route>,
        initRoute: any): void => {

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
        } catch (ex) {
            console.error("Could not digest HOT payload: ", ex);
        }

    };

}