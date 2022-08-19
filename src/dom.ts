class __Navimi_Dom implements INavimi_Dom {

    private _navimiCSSs: INavimi_CSSs;
    private _navimiJSs: INavimi_JSs;

    public init(navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs) {
        this._navimiCSSs = navimiCSSs;
        this._navimiJSs = navimiJSs;
    }

    public setTitle = (title: string): void => {
        document.title = title;
    };

    public setNavimiLinks = (): void => {
        document.querySelectorAll("[navimi-link]").forEach(el => {
            el.removeAttribute("navimi-link");
            el.setAttribute("navimi-linked", "");
            el.addEventListener('click', (e: any) => {
                e.preventDefault();
                (window as any).navigateTo(e.target.pathname);
            });
        });
    };

    public insertCss = (cssCode: string, url: string, type: string, prepend?: boolean): void => {
        document.querySelector(`[cssUrl='${url}']`)?.remove();
        if (type === "routeCss") {
            document.querySelector(`[cssType='${type}']`)?.remove();
        }
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

    public replaceCss = (cssCode: string, url: string): void => {
        const oldTag: HTMLStyleElement = url ? document.querySelector(`[cssUrl='${url}']`) : undefined;
        if (!oldTag) {
            return;
        }
        oldTag.innerHTML = cssCode;
    };

    public insertJS = (jsCode: string, jsUrl: string, isModule: boolean): void => {
        const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
        oldTag && oldTag.remove();

        const script: HTMLScriptElement = document.createElement("script");
        script.type = isModule ? "module" : "text/javascript";
        script.innerHTML = jsCode;
        script.setAttribute("jsUrl", jsUrl);
        const head = document.getElementsByTagName("head")[0];
        (head || document.body).appendChild(script);
    };

    public addLibrary = async (url: string | string[] | INavimi_Library[]): Promise<void> => {

        const arr: any[] = Array.isArray(url) ? url : [url];

        let urls: INavimi_Library[] = arr.map((url: any) => {
            if (typeof url === "string") {
                const type = url.split(".").pop();
                return {url, type: (type.toLowerCase() === "css") ? "css" : "jsLibrary"};
            } else {
                return url;
            }
        }).filter((obj: INavimi_Library) => !this._navimiJSs.isJsLoaded(obj.url));

        urls.length > 0 && await Promise.all(urls.map(obj => {
            if (obj.type.toLowerCase() === "css") {
                this._navimiCSSs.fetchCss(undefined, obj.url).then((cssCode) => {
                    this.insertCss(cssCode, obj.url, 'library', true);
                });
            } else {
                const type = obj.type.toLowerCase() === "module" ? "module" : "library";
                return this._navimiJSs.fetchJS(undefined, [obj.url], type);
            }
        })).catch(ex => {
            throw new Error(ex)
        });

    };

}