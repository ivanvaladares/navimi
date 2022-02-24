
class __Navimi_Templates implements INavimi_Templates {

    private _templatesCache: INavimi_KeyList<string> = {};
    private _loadedTemplates: INavimi_KeyList<boolean> = {};
    private _dependencyTemplatesMap: INavimi_KeyList<INavimi_KeyList<boolean>> = {};
    
    private _navimiFetch: INavimi_Fetch;

    public init(navimiFetch: INavimi_Fetch): void {
        this._navimiFetch = navimiFetch;
    }

    private loadTemplate = (templateCode: string, url?: string): void => {
        const regIni = new RegExp("<t ([^>]+)>");
        const regEnd = new RegExp("</t>");
        const regId = new RegExp("id=\"([^\"]+)\"");
        let tempCode = templateCode;

        if (!regIni.exec(tempCode)) {
            this._templatesCache[url] = tempCode;
            return;
        }

        while (templateCode && templateCode.length > 0) {
            const iniTemplate = regIni.exec(tempCode);

            if (!iniTemplate || iniTemplate.length === 0) {
                break;
            }

            const regIdRes = regId.exec(iniTemplate[1]);
            const idTemplate = regIdRes.length > 0 && regIdRes[1];
            tempCode = tempCode.substr(iniTemplate.index + iniTemplate[0].length);
            const endTemplate = regEnd.exec(tempCode);

            if (!idTemplate || !endTemplate || endTemplate.length === 0) {
                break;
            }

            this._templatesCache[idTemplate] = tempCode.substr(0, endTemplate.index);
        }
    };

    public isTemplateLoaded = (url: string): boolean => {
        return this._loadedTemplates[url] !== undefined;
    };

    public getTemplate = (templateId: string | string[]): string | string[] => {
        const ids = Array.isArray(templateId) ? templateId : [templateId];
        const arrTemplates = ids.map(id => this._templatesCache[id]);
        return arrTemplates.length > 1 ? arrTemplates : arrTemplates[0];
    };

    public fetchTemplate = (abortController: AbortController, urls: string[], jsUrl?: string): Promise<void | void[]> => {
        const init = (url: string): Promise<void> => {
            return new Promise(async (resolve, reject) => {
                if (!url || this._loadedTemplates[url]) {
                    return resolve();
                }
                try {
                    const templateCode = await this._navimiFetch.fetchFile(url, {
                        headers: {
                            Accept: "text/html"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });

                    this.loadTemplate(templateCode, url);
                    this._loadedTemplates[url] = true;
                    resolve();

                } catch (ex) {
                    reject(ex);
                }
            });
        };

        if (jsUrl) {
            urls.map((u: string) => {
                this._dependencyTemplatesMap[u] = {
                    ...this._dependencyTemplatesMap[u] || {},
                    [jsUrl]: true
                };
            });
        }

        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    public reloadTemplate = (filePath: string,
        templateCode: string,
        routeList: INavimi_KeyList<INavimi_Route>,
        currentJS: string,
        globalTemplatesUrl: string,
        callback: any): void => {
        const isSameFile = __Navimi_Helpers.isSameFile;

        if (isSameFile(globalTemplatesUrl, filePath)) {
            console.log(`${filePath} updated.`);
            this.loadTemplate(templateCode, globalTemplatesUrl);
            callback();
            return;
        }

        for (const routeUrl in routeList) {
            const { jsUrl, templatesUrl } = routeList[routeUrl];

            if (isSameFile(templatesUrl, filePath)) {
                console.log(`${filePath} updated.`);

                this.loadTemplate(templateCode, templatesUrl);

                currentJS === jsUrl && callback();
                return;
            }
        }

        for (const templatesUrl in this._dependencyTemplatesMap) {
            if (isSameFile(templatesUrl, filePath)) {
                console.log(`${filePath} updated.`);

                this.loadTemplate(templateCode, templatesUrl);

                Object.keys(this._dependencyTemplatesMap[templatesUrl]).map(s => {
                    if (s === currentJS) {
                        //reload route if current JS is updated
                        callback();
                    }
                });

            }
        }

    };

}
