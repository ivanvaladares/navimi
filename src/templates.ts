namespace __Navimi_Templates {

    let templatesCache: KeyList<string> = {};
    let loadedTemplates: KeyList<boolean> = {};
    let dependencyTemplatesMap: KeyList<KeyList<boolean>> = {};

    const loadTemplate = (templateCode: string, url?: string): void => {
        const regIni = new RegExp("<t ([^>]+)>");
        const regEnd = new RegExp("</t>");
        const regId = new RegExp("id=\"([^\"]+)\"");
        let tempCode = templateCode;

        if (!regIni.exec(tempCode)) {
            templatesCache[url] = tempCode;
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

            templatesCache[idTemplate] = tempCode.substr(0, endTemplate.index);
        }
    };

    export const isTemplateLoaded = (url: string): boolean => {
        return loadedTemplates[url] !== undefined;
    };

    export const getTemplate = (templateId: string | string[]): string | string[] => {
        const ids = Array.isArray(templateId) ? templateId : [templateId];
        const arrTemplates = ids.map(id => templatesCache[id]);
        return arrTemplates.length > 1 ? arrTemplates : arrTemplates[0];
    };

    export const fetchTemplate = (abortController: AbortController, urls: string[], jsUrl?: string): Promise<void | void[]> => {
        const init = (url: string): Promise<void> => {
            return new Promise(async (resolve, reject) => {
                if (!url || loadedTemplates[url]) {
                    return resolve();
                }
                try {
                    const templateCode = await __Navimi_Fetch.fetchFile(url, {
                        headers: {
                            Accept: "text/html"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });

                    loadTemplate(templateCode, url);
                    loadedTemplates[url] = true;
                    resolve();

                } catch (ex) {
                    reject(ex);
                }
            });
        };

        if (jsUrl) {
            urls.map((u: string) => {
                dependencyTemplatesMap[u] = {
                    ...dependencyTemplatesMap[u] || {},
                    [jsUrl]: true
                };
            });
        }

        return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
    };

    export const reloadTemplate = (filePath: string, 
                                templateCode: string, 
                                routeList: KeyList<Route>, 
                                currentJS: string, 
                                globalTemplatesUrl: string, 
                                callback: any): void => 
    {
        const isSameFile = __Navimi_Helpers.isSameFile;

        if (isSameFile(globalTemplatesUrl, filePath)) {
            console.log(`${filePath} updated.`);
            loadTemplate(templateCode, globalTemplatesUrl);
            callback();
            return;
        }

        for (const routeUrl in routeList) {
            const { jsUrl, templatesUrl } = routeList[routeUrl];

            if (isSameFile(templatesUrl, filePath)) {
                console.log(`${filePath} updated.`);

                loadTemplate(templateCode, templatesUrl);

                currentJS === jsUrl && callback();
                return;
            }
        }

        for (const templatesUrl in dependencyTemplatesMap) {
            if (isSameFile(templatesUrl, filePath)) {
                console.log(`${filePath} updated.`);

                loadTemplate(templateCode, templatesUrl);

                Object.keys(dependencyTemplatesMap[templatesUrl]).map(s => {
                    if (s === currentJS) {
                        //reload route if current JS is updated
                        callback();
                    }
                });
                
            }
        }

    };
}