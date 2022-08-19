class __Navimi_CSSs implements INavimi_CSSs {

    private _navimiDom: INavimi_Dom;
    private _navimiFetch: INavimi_Fetch;
    private _loadedCsss: INavimi_KeyList<string> = {};

    public init(navimiDom: INavimi_Dom, navimiFetch: INavimi_Fetch): void {
        this._navimiDom = navimiDom;
        this._navimiFetch = navimiFetch;
    }

    public isCssLoaded = (url: string): boolean => {
        return this._loadedCsss[url] !== undefined;
    };

    public getCss = (url: string): string => {
        return this._loadedCsss[url];
    };

    public fetchCss = (abortController: AbortController, url: string): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            if (!url || this._loadedCsss[url]) {
                return resolve(this._loadedCsss[url]);
            }
            try {
                const cssCode = await this._navimiFetch.fetchFile(url, {
                    headers: {
                        Accept: "text/css"
                    },
                    signal: abortController ? abortController.signal : undefined
                });

                this._loadedCsss[url] = cssCode;
                resolve(cssCode);

            } catch (ex) {
                reject(ex);
            }
        });
    };

    //removeIf(minify)
    public digestHot = ({filePath, data}: hotPayload): Promise<void> => {

        if (!this.isCssLoaded(filePath)) {
            return;
        }
        
        this._loadedCsss[filePath] = data;

        this._navimiDom.replaceCss(data, filePath);

        console.log(`${filePath} updated.`);

        return Promise.resolve();

    };
    //endRemoveIf(minify)


}
//removeIf(dist)
module.exports.css = __Navimi_CSSs;
//endRemoveIf(dist)
