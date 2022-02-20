namespace __Navimi_CSSs {

    let loadedCsss: KeyList<string> = {};

    export const isCssLoaded = (url: string): boolean => {
        return loadedCsss[url] !== undefined;
    };

    export const getCss = (url: string): string => {
        return loadedCsss[url];
    };

    export const loadCss = (url: string, data: string): void => {
        loadedCsss[url] = data;
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

}