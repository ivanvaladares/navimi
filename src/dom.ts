namespace __Navimi_Dom {

    export const setTitle = (title: string): void => {
        document.title = title;
    };

    export const setNavimiLinks = (navigateTo: (url: string, params?: KeyList<any>) => void): void => {
        document.querySelectorAll("[navimi-link]").forEach(el => {
            el.removeAttribute("navimi-link");
            el.setAttribute("navimi-linked", "");
            el.addEventListener('click', (e: any) => {
                e.preventDefault();
                navigateTo(e.target.pathname);
            });
        });
    };

    export const insertCss = (cssCode: string, type?: string, prepend?: boolean): void => {
        const oldTag = type ? document.querySelector(`[cssId='${type}']`) : undefined;
        oldTag && oldTag.remove();
        if (!cssCode) {
            return;
        }
        const style: HTMLStyleElement = document.createElement("style");
        style.innerHTML = cssCode;
        type && style.setAttribute(type, "");
        const head = document.getElementsByTagName("head")[0];
        const target = (head || document.body);
        prepend ? target.prepend(style) : target.appendChild(style);
    };

    export const insertJS = (jsCode: string, jsUrl: string): void => {
        const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
        oldTag && oldTag.remove();

        const script: HTMLScriptElement = document.createElement("script");
        script.type = "text/javascript";
        script.innerHTML = jsCode;
        script.setAttribute("jsUrl", jsUrl);
        const head = document.getElementsByTagName("head")[0];
        (head || document.body).appendChild(script);
    };

    export const addLibrary = async (jsOrCssUrl: string | string[]): Promise<void> => {
        let urls = Array.isArray(jsOrCssUrl) ? jsOrCssUrl : [jsOrCssUrl];
        urls = urls.filter(url => !__Navimi_JSs.isJsLoaded(url));

        urls.length > 0 && await Promise.all(urls.map(url => {
            const type = url.split(".").pop();
            if (type.toLowerCase() === "css") {
                __Navimi_CSSs.fetchCss(undefined, url, true);
            } else {
                return __Navimi_JSs.fetchJS(undefined, [url]);
            }
        })).catch(ex => {
            throw new Error(ex)
        });

    };

}