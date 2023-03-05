import { INavimi_Route } from '../@types/Navimi';

const parseQuery = (queryString: string): Record<string, string> => {
    const query: Record<string, string> = {};
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

    const queryPos = path.indexOf('?');
    path = queryPos >= 0 ? path.substring(0, queryPos) : path;

    return path.split('/').filter(p => p.length > 0);
};

const parsePath = (urlPath: string, urlPattern: string): Record<string, unknown> => {
    const queryPos = urlPath.indexOf('?');
    const query = queryPos > 0 ? urlPath.substring(queryPos + 1, urlPath.length) : '';
    const path = splitPath(urlPath);
    const pattern = splitPath(urlPattern);

    let params: Record<string, unknown> = {};

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
            if (!path[i] || pattern[i].toLowerCase() !== path[i].toLowerCase())
                return null;
        }
    }

    return params;
};

export const getRouteAndParams = (url: string, routingList: Record<string, INavimi_Route>): { routeItem: INavimi_Route, params: unknown } => {
    const urlParams = splitPath(url);
    const catchAll = routingList['*'];
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
        params = parsePath(url, url);
        routeItem = catchAll;
    }

    return { routeItem, params };
};
