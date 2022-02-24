interface INavimi_Helpers {
    isSameFile: (path1: string, path2: string) => boolean;
    timeout: (ms: number) => Promise<void>;
    debounce: (task: (args: any[]) => any, ms: number) => () => void;
    getUrl: () => string;
    removeHash: (url: string) => string;
    stringify: (obj: any) => string;
    cloneObject: (obj: any) => INavimi_KeyList<any>;
    getRouteAndParams: (url: string, routingList: INavimi_KeyList<INavimi_Route>) => {routeItem: INavimi_Route, params: any};
}