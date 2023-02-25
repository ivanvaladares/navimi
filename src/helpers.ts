import { INavimi_Helpers } from './@types/INavimi_Helpers';
import { INavimi_Route } from './@types/Navimi';

class __Navimi_Helpers implements INavimi_Helpers {

    private parseQuery = (queryString: string): Record<string, string> => {
        const query: Record<string, string> = {};
        queryString.split('&').map(pair => {
            const kv = pair.split('=');
            query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        return query;
    };

    private splitPath = (path: string): string[] => {
        if (!path) {
            return [];
        }

        const queryPos = path.indexOf('?');
        path = queryPos >= 0 ? path.substring(0, queryPos) : path;

        return path.split('/').filter(p => p.length > 0);
    };

    private parsePath = (urlPath: string, urlPattern: string): Record<string, unknown> => {
        const queryPos = urlPath.indexOf('?');
        const query = queryPos > 0 ? urlPath.substring(queryPos + 1, urlPath.length) : '';
        const path = this.splitPath(urlPath);
        const pattern = this.splitPath(urlPattern);

        let params: Record<string, unknown> = {};

        if (queryPos > 0) {
            params = {
                queryString: this.parseQuery(query)
            };
        }

        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i].charAt(0) === ':') {
                const name = pattern[i].slice(1);
                if (path.length <= i) {
                    return null;
                }
                params[name] = decodeURIComponent(path[i]);
            }
            else {
                if (!path[i] || pattern[i].toLowerCase() !== path[i].toLowerCase())
                    return null;
            }
        }

        return params;
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    public debounce = (task: Function, wait: number): () => void => {
        let timeout: ReturnType<typeof setTimeout>;

        return function (...args) {
            const func = (): void => {
                timeout = null;
                task.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(func, wait);
        };
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    public throttle = (task: Function, wait: number, context: unknown): () => void => {
        let timeout: ReturnType<typeof setTimeout>;
        let lastTime: number;

        return function (...args) {
            const now = Date.now();

            if (lastTime && now < lastTime + wait) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    lastTime = now;
                    task.apply(context, args);
                }, wait);
            } else {
                lastTime = now;
                task.apply(context, args);
            }
        };
    };

    public getUrl = (): string => {
        const location = document.location;
        const matches = location.toString().match(/^[^#]*(#.+)$/);
        const hash = matches ? matches[1] : '';

        return [location.pathname, location.search, hash].join('');
    };

    public setTitle = (title: string): void => {
        document.title = title;
    };

    public setNavimiLinks = (): void => {
        document.querySelectorAll('[navimi-link]').forEach(el => {
            el.removeAttribute('navimi-link');
            el.addEventListener('click', (e: MouseEvent) => {
                e.preventDefault();
                (window as any).navigateTo((event.target as HTMLAnchorElement).pathname);
            });
        });
    };

    public removeHash = (url: string): string => {
        const hashPos = url.indexOf('#');
        return hashPos > 0 ? url.substring(0, hashPos) : url;
    };

    public stringify = (obj: any) => {
        const visited = new Map<any, number>();
        let index = 0;

        const iterateObject = (obj: any): any => {
            if (typeof obj === 'function') {
                return String(obj);
            }

            if (obj instanceof Error) {
                return obj.message;
            }

            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            if (visited.has(obj)) {
                return `[Circular: ${visited.get(obj)}]`;
            }

            visited.set(obj, index++);

            if (Array.isArray(obj)) {
                const aResult = obj.map(iterateObject);
                visited.delete(obj);
                return aResult;
            }

            const result = Object.keys(obj).reduce((result: any, prop: string) => {
                result[prop] = iterateObject(((obj, prop) => {
                    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                        try {
                            return obj[prop];
                        } catch {
                            return;
                        }
                    }
                    return obj[prop];
                })(obj, prop));
                return result;
            }, {});

            visited.delete(obj);

            return result;
        };

        return JSON.stringify(iterateObject(obj));
    };

    public cloneObject = (obj: any): Record<string, any> => {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Error) {
            return new Error(obj.message);
        }

        if (Array.isArray(obj)) {
            return obj.map(this.cloneObject);
        }

        return Object.assign({}, ...Object.entries(obj).map(([key, value]) => ({
            [key]: this.cloneObject(value)
        })));
    };

    public getRouteAndParams = (url: string, routingList: Record<string, INavimi_Route>): { routeItem: INavimi_Route, params: unknown } => {
        const urlParams = this.splitPath(url);
        const catchAll = routingList['*'];
        let routeItem, params;

        for (const routeUrl in routingList) {
            const routeParams = this.splitPath(routeUrl);

            if (routeParams.length === urlParams.length) {
                params = this.parsePath(url, routeUrl);
                if (params) {
                    routeItem = routingList[routeUrl];
                    break;
                }
            }
        }

        if (!routeItem && catchAll) {
            params = this.parsePath(url, url);
            routeItem = catchAll;
        }

        return { routeItem, params };
    };

    public getNodeType = (node: Element): string => {
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                return 'text';
            case Node.COMMENT_NODE:
                return 'comment';
            default:
                return node.tagName.toLowerCase();
        }
    };

    public getNodeContent = (node: Node): string | null => {
        if (node.childNodes.length > 0) {
            return null;
        }
        return node.textContent;
    };

    public mergeHtmlElement = (templateNode: Element, documentNode: Element, callback: (template: Element, node: Element | DocumentFragment) => void): void => {
        // Clear child nodes
        if (documentNode.childNodes.length > 0 && !templateNode.childNodes.length) {
            documentNode.innerHTML = '';
            return;
        }

        // Prepare empty node for next round
        if (!documentNode.childNodes.length && templateNode.childNodes.length) {
            const fragment = document.createDocumentFragment();
            callback(templateNode, fragment);
            documentNode.appendChild(fragment);
            return;
        }

        // Dive deeper into the tree
        if (templateNode.childNodes.length > 0) {
            callback(templateNode, documentNode);
        }
    };

    public syncAttributes = (templateNode: Element, documentNode: Element): void => {
        if (templateNode.tagName.toLowerCase() !== documentNode.tagName.toLowerCase()) {
            return;
        }

        const documentNodeAttr: Attr[] = [].slice.call(documentNode.attributes);
        const templateNodeAttr: Attr[] = [].slice.call(templateNode.attributes);

        const update = templateNodeAttr.filter(templateAttr => {
            const documentAttr = documentNodeAttr.find(
                (docAttr: Attr) => templateAttr.name === docAttr.name
            );
            return documentAttr && templateAttr.value !== documentAttr.value;
        });
        const remove = documentNodeAttr.filter(
            (docAttr) => !templateNodeAttr.some((templateAttr) => docAttr.name === templateAttr.name)
        );
        const add = templateNodeAttr.filter(
            (templateAttr) => !documentNodeAttr.some((docAttr) => templateAttr.name === docAttr.name)
        );

        remove.forEach((attr) => {
            documentNode.removeAttribute(attr.name);
        });

        [...update, ...add].forEach(({ name, value }) => {
            documentNode.setAttribute(name, value);
        });
    };

}

export default __Navimi_Helpers;
