class __Navimi_CSSs implements INavimi_CSSs {

    private _navimiFetch: INavimi_Fetch;
    private _loadedCsss: INavimi_KeyList<string> = {};
    private _cssRulesCache: INavimi_KeyList<string> = {};
    private _cssCount = 0;
    private _cssSheet: CSSStyleSheet;
    private _atomicCssId = '__navimi__cssInJs__';

    public init(navimiFetch: INavimi_Fetch): void {
        this._navimiFetch = navimiFetch;
        this._addCssToDom('', true, { id: this._atomicCssId });
    }

    private _replaceCss = (cssCode: string, url: string): void => {
        const oldTag = document.querySelector(`[cssUrl='${url}']`);
        if (!oldTag) {
            return;
        }
        oldTag.innerHTML = cssCode;
    };

    private _insertCssRule = ({ className, child, media, cssRule }: INavimi_CssRule): void => {
        if (!this._cssSheet) {
            const style = document.querySelector(`style[id=${this._atomicCssId}]`) as HTMLStyleElement;
            this._cssSheet = style.sheet;
        }
        const rule = `.${`${className}${child}`}{${cssRule.join(';')}}`;
        this._cssSheet.insertRule(media ? `${media}{${rule}}` : rule, this._cssSheet.cssRules.length);
    };

    private _addCssToDom = (cssCode: string, prepend?: boolean, props?: INavimi_KeyList<string>): void => {
        if (!document) return null;
        const style = document.createElement('style');
        style.innerHTML = cssCode;
        props && Object.entries(props).forEach(([key, value]) => {
            style.setAttribute(key, value);
        });
        const head = document.getElementsByTagName('head')[0];
        const target = (head || document.body);
        prepend ? target.prepend(style) : target.appendChild(style);
    };

    private _parseCssRules = (obj: object, child = '', media = ''): INavimi_CssRule[] => {
        return Object.entries(obj).reduce((rules, [key, value]) => {
            if (value && typeof value === 'object') {
                const _media = /^@/.test(key) ? key : null
                const _child = _media ? child : child + key.replace(/&/g, '')
                return rules.concat(this._parseCssRules(value, _child, _media || media));
            }
            return rules.concat({ media, child, cssRule: [`${key}:${value}`] });
        }, []);
    }

    public isCssLoaded = (url: string): boolean => {
        return this._loadedCsss[url] !== undefined;
    };

    public fetchCss = (abortController: AbortController, url: string): Promise<void> => {
        if (!url || this._loadedCsss[url]) {
            return Promise.resolve();
        }

        return this._navimiFetch.fetchFile(url, {
            headers: {
                Accept: 'text/css'
            },
            signal: abortController ? abortController.signal : undefined
        }).then(cssCode => {
            this._loadedCsss[url] = cssCode;
        })

    };

    public insertCss = (url: string, type: string, prepend?: boolean): void => {
        if (type === 'routeCss') {
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

        this._addCssToDom(cssCode, prepend, { cssUrl: url, cssType: type });
    };

    public style = (...styles: object[]): string => {
        return styles.map(style => this._parseCssRules(style).map(rule => {
            const cacheKey = JSON.stringify(rule);
            if (this._cssRulesCache[cacheKey]) {
                return this._cssRulesCache[cacheKey];
            }
            const className = `__navimi_${this._cssCount++}`;
            this._insertCssRule({ ...rule, className });
            this._cssRulesCache[cacheKey] = className;
            return className;
        }).join(' ')).join('');
    }

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
