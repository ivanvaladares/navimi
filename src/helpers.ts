namespace __Navimi_Helpers {

    const parseQuery = (queryString: string): { [key: string]: string } => {
        const query: { [key: string]: string } = {};
        queryString.split('&').map(pair => {
            const kv = pair.split('=');
            query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        return query;
    };

    const splitPath = (path: string): string[] => {
        if (!path) {
            return [];
        }

        const queryPos = path.indexOf("?");
        path = queryPos >= 0 ? path.substr(0, queryPos) : path;

        return path.split("/").filter(p => p.length > 0);
    };

    const parsePath = (urlPath: string, urlPattern: string): { [key: string]: any } => {
        const queryPos = urlPath.indexOf("?");
        const query = queryPos > 0 ? urlPath.substr(queryPos + 1, urlPath.length) : "";
        const path = splitPath(urlPath);
        const pattern = splitPath(urlPattern);

        let params: any = {};

        if (queryPos > 0) {
            params = {
                queryString: parseQuery(query)
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
                if (!path[i] || pattern[i].toLocaleLowerCase() !== path[i].toLocaleLowerCase())
                    return null;
            }
        }

        return params;
    };

    export const timeout = (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    export const debounce = (task: (args: any[]) => any, ms: number): () => void => {
        let timeout: any;
        return function () {
            const func = (): void => {
                timeout = null;
                task.apply(this, arguments);
            };
            clearTimeout(timeout);
            timeout = setTimeout(func, ms);
        };
    };

    export const getUrl = (): string => {
        const location = document.location;
        const matches = location.toString().match(/^[^#]*(#.+)$/);
        const hash = matches ? matches[1] : "";
        return [location.pathname, location.search, hash].join("");
    };

    export const removeHash = (url: string): string => {
        const hashPos = url.indexOf("#");
        return hashPos > 0 ? url.substr(0, hashPos) : url;
    };

    export const stringify = (obj: any) => {
        const visited: any[] = [];

        const iterateObject = (obj: any) : any => {

            if (typeof obj === 'function') {
                return String(obj);
            }

            if (obj instanceof Error) {
                return obj.message;
            }

            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            if (visited.indexOf(obj) !== -1) {
                return `[Circular: ${visited.indexOf(obj)}]`;
            }

            visited.push(obj);

            if (Array.isArray(obj)) {
                const aResult = obj.map(iterateObject);
                visited.pop();
                return aResult;
            }

            const result = Object.keys(obj).reduce((result: any, prop: string) => {
                result[prop] = iterateObject(((obj, prop) => {
                    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                        try {
                            return obj[prop];
                        }
                        catch (err) {
                            return err.message;
                        }
                    }
                    return obj[prop];
                })(obj, prop));
                return result;
            }, {});

            visited.pop();

            return result;
        };

        return JSON.stringify(iterateObject(obj));
    };

    export const cloneObject = (obj: any) : { [key: string]: any } => {
        var ot = Array.isArray(obj);
        return obj === null || typeof obj !== "object" ? obj :  
                Object.keys(obj).reduce((prev: any, current: string) => 
                    obj[current] !== null && typeof obj[current] === "object" ? 
                        (prev[current] = cloneObject(obj[current]), prev) : 
                        (prev[current] = obj[current], prev), ot ? [] : {});
    };

    export const getRouteAndParams = (url: string, routingList: { [url: string]: Route }): any => {
        const urlParams = splitPath(url);
        const catchAll = routingList["*"];
        let routeItem, params;

        for (const routeUrl in routingList) {
            const routeParams = splitPath(routeUrl);

            if (routeParams.length === urlParams.length) {
                params = parsePath(url, routeUrl);
                if (params) {
                    routeItem = routingList[routeUrl];
                    break;
                }
            }
        }
        
        if (!routeItem && catchAll) {
            routeItem = catchAll;
        }

        return { routeItem, params };
    };
}