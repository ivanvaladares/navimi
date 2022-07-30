class __Navimi_CSSs implements INavimi_CSSs {

    private _navimiDom: INavimi_Dom;
    private _navimiFetch: INavimi_Fetch;
    private _navimiHelpers: INavimi_Helpers;
    private _loadedCsss: INavimi_KeyList<string> = {};

    public init(navimiDom: INavimi_Dom, navimiFetch: INavimi_Fetch, navimiHelpers: INavimi_Helpers): void {
        this._navimiDom = navimiDom;
        this._navimiFetch = navimiFetch;
        this._navimiHelpers = navimiHelpers;
    }

    public isCssLoaded = (url: string): boolean => {
        return this._loadedCsss[url] !== undefined;
    };

    public getCss = (url: string): string => {
        return this._loadedCsss[url];
    };

    public fetchCss = (abortController: AbortController, url: string, autoInsert?: boolean): Promise<void | void[]> => {
        return new Promise<void>(async (resolve, reject) => {
            if (!url || this._loadedCsss[url]) {
                return resolve();
            }
            try {
                const cssCode = await this._navimiFetch.fetchFile(url, {
                    headers: {
                        Accept: "text/css"
                    },
                    signal: abortController ? abortController.signal : undefined
                });

                if (autoInsert) {
                    this._navimiDom.insertCss(cssCode, url, true);
                    this._loadedCsss[url] = "loaded";
                } else {
                    this._loadedCsss[url] = cssCode;
                }
                resolve();

            } catch (ex) {
                reject(ex);
            }
        });
    };

    //removeIf(minify)
    public reloadCss = (filePath: string, cssCode: string, routeList: INavimi_KeyList<INavimi_Route>, currentJS: string, globalCssUrl: string): void => {

        const isSameFile = this._navimiHelpers.isSameFile;

        if (isSameFile(globalCssUrl, filePath)) {
            console.log(`${filePath} updated.`);

            this._loadedCsss[globalCssUrl] = cssCode;

            this._navimiDom.insertCss(cssCode, "globalCss");

            return;
        }

        for (const routeUrl in routeList) {
            const { jsUrl, cssUrl } = routeList[routeUrl];

            if (isSameFile(cssUrl, filePath)) {
                console.log(`${filePath} updated.`);

                this._loadedCsss[cssUrl] = cssCode;

                if (currentJS === jsUrl) {
                    this._navimiDom.insertCss(cssCode, "routeCss");
                }

                return;
            }
        }

    };
    //endRemoveIf(minify)

}