class __Navimi_Templates implements INavimi_Templates {

    private _templatesCache: INavimi_KeyList<string> = {};
    private _loadedTemplates: INavimi_KeyList<boolean> = {};
    private _navimiFetch: INavimi_Fetch;        
    private _regIni: RegExp;
    private _regEnd: RegExp;
    private _regId: RegExp;

    public init(navimiFetch: INavimi_Fetch): void {
        this._navimiFetch = navimiFetch;

        this._regIni = new RegExp("<t ([^>]+)>");
        this._regEnd = new RegExp("</t>");
        this._regId = new RegExp("id=(\"[^\"]+\"|\'[^\']+\')");
    }

    private loadTemplate = (templateCode: string, url?: string): void => {
        let tempCode = templateCode;

        if (!this._regIni.exec(tempCode)) {
            this._templatesCache[url] = tempCode;
            return;
        }

        while (templateCode && templateCode.length > 0) {
            const iniTemplate = this._regIni.exec(tempCode);

            if (!iniTemplate || iniTemplate.length === 0) {
                break;
            }

            const regIdRes = this._regId.exec(iniTemplate[1]);
            const idTemplate = regIdRes.length > 0 && regIdRes[1].slice(1, -1);
            tempCode = tempCode.substr(iniTemplate.index + iniTemplate[0].length);
            const endTemplate = this._regEnd.exec(tempCode);

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

    public fetchTemplate = (abortController: AbortController, url: string | string[]): Promise<void | void[]> => {
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

        const urls: string[] = Array.isArray(url) ? url : [url];

        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    //removeIf(minify)
    public digestHot = ({filePath, data}: hotPayload): Promise<void> => {
        
        if (!this.isTemplateLoaded(filePath)) {
            return;
        }
        
        this.loadTemplate(data, filePath);

        console.log(`${filePath} updated.`);

        return Promise.resolve();
    };
    //endRemoveIf(minify)

}

//removeIf(dist)
module.exports.templates = __Navimi_Templates;
//endRemoveIf(dist)