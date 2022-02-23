namespace __Navimi {

    interface hotPayload {
        filePath?: string;
        data?: string;
        message?: string;
    }

    interface hotFunctions {
        reloadCss: (filePath: string,
            cssCode: string,
            routeList: KeyList<Route>,
            currentJS: string,
            globalCssUrl: string) => void;

        reloadTemplate: (filePath: string,
            templateCode: string,
            routeList: KeyList<Route>,
            currentJS: string,
            globalTemplatesUrl: string,
            callback: any) => void;

        reloadJs: (filePath: string,
            jsCode: string,
            routeList: KeyList<Route>,
            currentJS: string,
            callback: any) => void;
    }

    export class Navimi_hot {

        private wsHotClient: WebSocket;
        private hotFunctions: hotFunctions;

        constructor(_hotFunctions: hotFunctions) {
            this.hotFunctions = _hotFunctions;
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
                    this.wsHotClient = null;
                    this.wsHotClient = new WebSocket(`ws://localhost:${port}`);
                    this.wsHotClient.addEventListener('message', (e: any) => {
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

                                    this.digestHot(json,
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
                    this.wsHotClient.onclose = () => {
                        console.warn('HOT Connection Closed!');
                        setTimeout(this.openHotWs, 5000, hotOption);
                    };
                } catch (ex) {
                    console.error(ex);
                }
            }
        };

        private digestHot = (payload: hotPayload,
            globalCssUrl: string,
            globalTemplatesUrl: string,
            currentJs: string,
            routesList: KeyList<Route>,
            initRoute: any): void => {

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
                } catch (ex) {
                    console.error("Could not digest HOT payload: ", ex);
                }
            }

        };
    }
}
