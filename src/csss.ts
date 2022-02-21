namespace __Navimi_CSSs {

    const loadedCsss: KeyList<string> = {};

    export const isCssLoaded = (url: string): boolean => {
        return loadedCsss[url] !== undefined;
    };

    export const getCss = (url: string): string => {
        return loadedCsss[url];
    };

    export const fetchCss = (abortController: AbortController, url: string, autoInsert?: boolean): Promise<void | void[]> => {
        return new Promise<void>(async (resolve, reject) => {
            if (!url || loadedCsss[url]) {
                return resolve();
            }
            try {
                const cssCode = await __Navimi_Fetch.fetchFile(url, {
                    headers: {
                        Accept: "text/css"
                    },
                    signal: abortController ? abortController.signal : undefined
                });

                if (autoInsert) {
                    __Navimi_Dom.insertCss(cssCode, url, true);
                    loadedCsss[url] = "loaded";
                } else {
                    loadedCsss[url] = cssCode;
                }
                resolve();

            } catch (ex) {
                reject(ex);
            }
        });
    };
    
    export const reloadCss = (filePath: string, 
                                cssCode: string, 
                                routeList: KeyList<Route>, 
                                currentJS: string, 
                                globalCssUrl: string): void => 
    {
        
        const isSameFile = __Navimi_Helpers.isSameFile;

        if (isSameFile(globalCssUrl, filePath)) {
            console.log(`${filePath} updated.`);

            loadedCsss[globalCssUrl] = cssCode;

            __Navimi_Dom.insertCss(cssCode, "globalCss");

            return;
        }

        for (const routeUrl in routeList) {
            const { jsUrl, cssUrl } = routeList[routeUrl];

            if (isSameFile(cssUrl, filePath)) {
                console.log(`${filePath} updated.`);

                loadedCsss[cssUrl] = cssCode;

                if (currentJS === jsUrl) {
                    __Navimi_Dom.insertCss(cssCode, "routeCss");
                }

                return;
            }
        }

    };
}