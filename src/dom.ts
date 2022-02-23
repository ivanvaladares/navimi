namespace __Navimi {

    export class Navimi_Dom {

        private cssFunctions: any;
        private jsFunctions: any;

        public init(_cssFunctions: any, _jsFunctions: any) {
            this.cssFunctions = _cssFunctions;
            this.jsFunctions = _jsFunctions;
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
    
        public insertCss = (cssCode: string, type?: string, prepend?: boolean): void => {
            const oldTag = type ? document.querySelector(`[cssId='${type}']`) : undefined;
            oldTag && oldTag.remove();
            if (!cssCode) {
                return;
            }
            const style: HTMLStyleElement = document.createElement("style");
            style.innerHTML = cssCode;
            type && style.setAttribute("cssId", type);
            const head = document.getElementsByTagName("head")[0];
            const target = (head || document.body);
            prepend ? target.prepend(style) : target.appendChild(style);
        };
    
        public insertJS = (jsCode: string, jsUrl: string): void => {
            const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
            oldTag && oldTag.remove();
    
            const script: HTMLScriptElement = document.createElement("script");
            script.type = "text/javascript";
            script.innerHTML = jsCode;
            script.setAttribute("jsUrl", jsUrl);
            const head = document.getElementsByTagName("head")[0];
            (head || document.body).appendChild(script);
        };
    
        public addLibrary = async (jsOrCssUrl: string | string[]): Promise<void> => {
            let urls = Array.isArray(jsOrCssUrl) ? jsOrCssUrl : [jsOrCssUrl];
            urls = urls.filter(url => !this.jsFunctions.isJsLoaded(url));
    
            urls.length > 0 && await Promise.all(urls.map(url => {
                const type = url.split(".").pop();
                if (type.toLowerCase() === "css") {
                    this.cssFunctions.fetchCss(undefined, url, true);
                } else {
                    return this.jsFunctions.fetchJS(undefined, [url]);
                }
            })).catch(ex => {
                throw new Error(ex)
            });
    
        };
    
    }

}