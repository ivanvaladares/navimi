namespace __Navimi_Hot {

    let wsHotClient: WebSocket;

    const openHotWs = (hotOption: number | boolean): void => {
        try {
            if (!('WebSocket' in window)) { 
                console.error("Websocket is not supported by your browser!");
                return;
            }

            console.log("Connecting HOT...");
            const port = hotOption === true ? 8080 : hotOption;
            wsHotClient = null;
            wsHotClient = new WebSocket(`ws://localhost:${port}`);
            wsHotClient.addEventListener('message', (e: any) => {
                try {
                    const json: any = JSON.parse(e.data || "");
                    if (json.message) {
                        console.log(json.message);
                        return;
                    }
                    if (json.filePath) {
                        //this.digestHot(json);
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
    };

    window['__Navimi_Hot'] = openHotWs;
    
    // private digestHot = (file: any): void => {
    //     const isSameFile = (path1: string, path2: string) => {
    //         return path1 && path2 && path1.split("?").shift().toLowerCase() ==
    //             path2.split("?").shift().toLowerCase();
    //     }

    //     try {
    //         const filePath = file.filePath.replace(/\\/g, "/");
    //         const pages: any = this.win[this.pagesNamespace];

    //         if (isSameFile(this.options.globalCssUrl, filePath)) {
    //             console.log(`${file.filePath} updated.`);
    //             __Navimi_CSSs.loadCss(file.filePath, file.data);
    //             __Navimi_Dom.insertCss(file.data, "globalCss");
    //             return;
    //         }

    //         if (this.currentJS && isSameFile(this.options.globalTemplatesUrl, filePath)) {
    //             console.log(`${file.filePath} updated.`);
    //             __Navimi_Templates.loadTemplate(file.data, this.options.globalTemplatesUrl);
    //             this.initJS(this.currentJS);
    //             __Navimi_Dom.setNavimiLinks(this.navigateTo);
    //             return;
    //         }

    //         if (this.currentJS && this.externalJSsMap[filePath]) {
    //             console.log(`${file.filePath} updated.`);
    //             pages[this.callbackNS + filePath] = () => {
    //                 Object.keys(this.externalJSsMap[filePath]).map(s => {
    //                     this.routesJSs[s] = undefined;
    //                     if (s === this.currentJS) {
    //                         this.initRoute(undefined, undefined, true);
    //                     }
    //                 });
    //             };
    //             __Navimi_Dom.insertJS(file.data, filePath, true);
    //             return;
    //         }

    //         if (this.currentJS && this.externalTemplatesMap[filePath]) {
    //             console.log(`${file.filePath} updated.`);
    //             __Navimi_Templates.loadTemplate(file.data);
    //             Object.keys(this.externalTemplatesMap[filePath])
    //                 .find(s => s === this.currentJS) &&
    //                 this.initJS(this.currentJS);
    //             return;
    //         }

    //         for (const routeUrl in this.routingList) {
    //             const routeItem = this.routingList[routeUrl];

    //             if (this.currentJS && isSameFile(routeItem.jsUrl, filePath)) {
    //                 if (this.routesJSs[routeItem.jsUrl]) {
    //                     console.log(`${file.filePath} updated.`);
    //                     this.routesJSs[routeItem.jsUrl] = undefined;
    //                     pages[this.callbackNS + routeItem.jsUrl] = () => {
    //                         this.currentJS === routeItem.jsUrl &&
    //                             this.initJS(this.currentJS);
    //                     };
    //                     __Navimi_Dom.insertJS(file.data, routeItem.jsUrl, false);
    //                     __Navimi_Dom.setNavimiLinks(this.navigateTo);
    //                 }
    //                 return;
    //             }

    //             if (isSameFile(routeItem.cssUrl, filePath)) {
    //                 console.log(`${file.filePath} updated.`);
    //                 __Navimi_CSSs.loadCss(routeItem.cssUrl, file.data);
    //                 (this.currentJS && this.currentJS === routeItem.jsUrl ||
    //                     routeItem.cssUrl === this.currentRouteItem.cssUrl) &&
    //                     __Navimi_Dom.insertCss(file.data, "routeCss");
    //                 return;
    //             }

    //             if (isSameFile(routeItem.templatesUrl, filePath)) {
    //                 console.log(`${file.filePath} updated.`);
    //                 __Navimi_Templates.loadTemplate(file.data, routeItem.templatesUrl);
    //                 (this.currentJS && this.currentJS === routeItem.jsUrl ||
    //                     routeItem.templatesUrl === this.currentRouteItem.templatesUrl) &&
    //                     this.initJS(this.currentJS);
    //                 __Navimi_Dom.setNavimiLinks(this.navigateTo);
    //                 return;
    //             }
    //         }

    //     } catch (ex) {
    //         console.error("Could not digest HOT message: ", ex);
    //     }
    // };


}