class __Navimi_CSSs implements INavimi_CSSs {

    private _navimiFetch: INavimi_Fetch;
    private _loadedCsss: INavimi_KeyList<string> = {};

    public init(navimiFetch: INavimi_Fetch): void {
        this._navimiFetch = navimiFetch;
    }

    private _replaceCss = (cssCode: string, url: string): void => {
        const oldTag = document.querySelector(`[cssUrl='${url}']`);
        if (!oldTag) {
            return;
        }
        oldTag.innerHTML = cssCode;
    };

    public isCssLoaded = (url: string): boolean => {
        return this._loadedCsss[url] !== undefined;
    };

    public fetchCss = (abortController: AbortController, url: string): Promise<void> => {
        if (!url || this._loadedCsss[url]) {
            return Promise.resolve();
        }

        return this._navimiFetch.fetchFile(url, {
            headers: {
                Accept: "text/css"
            },
            signal: abortController ? abortController.signal : undefined
        }).then(cssCode => {
            this._loadedCsss[url] = cssCode;
        })

    };

    public insertCss = (url: string, type: string, prepend?: boolean): void => {
        if (type === "routeCss") {
            const oldRouteTag = document.querySelector(`[cssType='${type}']`);
            if (oldRouteTag) {
                if (oldRouteTag.getAttribute('cssUrl') === url) {
                    return;
                }
                oldRouteTag.remove();
            }
        }

        //avoid reinserting the same css
        if (document.querySelector(`[cssUrl='${url}']`)) {
            return;
        }

        const cssCode = this._loadedCsss[url];
        if (!cssCode) {
            return;
        }
        const style: HTMLStyleElement = document.createElement("style");
        style.innerHTML = cssCode;
        url && style.setAttribute("cssUrl", url);
        url && style.setAttribute("cssType", type);
        const head = document.getElementsByTagName("head")[0];
        const target = (head || document.body);
        prepend ? target.prepend(style) : target.appendChild(style);
    };

    //removeIf(minify)
    public digestHot = ({ filePath, data }: hotPayload): Promise<void> => {

        if (!this.isCssLoaded(filePath)) {
            return Promise.reject();
        }

        this._loadedCsss[filePath] = data;

        this._replaceCss(data, filePath);

        console.log(`${filePath} updated.`);

        return Promise.resolve();

    };
    //endRemoveIf(minify)


}

//removeIf(dist)
module.exports.csss = __Navimi_CSSs;
//endRemoveIf(dist)
