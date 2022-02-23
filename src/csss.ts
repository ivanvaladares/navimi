namespace __Navimi {
    
    export class Navimi_CSSs {

        private domFunctions: any;
        private navimiFetch: any;
        public loadedCsss: KeyList<string> = {};

        public init(_domFunctions: any, _navimiFetch: any): void {
            this.domFunctions = _domFunctions;
            this.navimiFetch = _navimiFetch;
        }

        public isCssLoaded = (url: string): boolean => {
            return this.loadedCsss[url] !== undefined;
        };

        public getCss = (url: string): string => {
            return this.loadedCsss[url];
        };

        public fetchCss = (abortController: AbortController, url: string, autoInsert?: boolean): Promise<void | void[]> => {
            return new Promise<void>(async (resolve, reject) => {
                if (!url || this.loadedCsss[url]) {
                    return resolve();
                }
                try {
                    const cssCode = await this.navimiFetch.fetchFile(url, {
                        headers: {
                            Accept: "text/css"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });

                    if (autoInsert) {
                        this.domFunctions.insertCss(cssCode, url, true);
                        this.loadedCsss[url] = "loaded";
                    } else {
                        this.loadedCsss[url] = cssCode;
                    }
                    resolve();

                } catch (ex) {
                    reject(ex);
                }
            });
        };
        
        public reloadCss = (filePath: string, 
                                    cssCode: string, 
                                    routeList: KeyList<Route>, 
                                    currentJS: string, 
                                    globalCssUrl: string): void => 
        {
            
            const isSameFile = __Navimi_Helpers.isSameFile;

            if (isSameFile(globalCssUrl, filePath)) {
                console.log(`${filePath} updated.`);

                this.loadedCsss[globalCssUrl] = cssCode;

                this.domFunctions.insertCss(cssCode, "globalCss");

                return;
            }

            for (const routeUrl in routeList) {
                const { jsUrl, cssUrl } = routeList[routeUrl];

                if (isSameFile(cssUrl, filePath)) {
                    console.log(`${filePath} updated.`);

                    this.loadedCsss[cssUrl] = cssCode;

                    if (currentJS === jsUrl) {
                        this.domFunctions.insertCss(cssCode, "routeCss");
                    }

                    return;
                }
            }

        };

    }
}