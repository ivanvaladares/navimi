interface INavimi_Helpers {
    timeout: (ms: number) => Promise<void>;
    debounce: (task: Function, wait: number) => () => void;
    throttle: (task: Function, wait: number, context: any) => () => void;
    getUrl: () => string;
    removeHash: (url: string) => string;
    stringify: (obj: any) => string;
    cloneObject: (obj: any) => INavimi_KeyList<any>;
    getRouteAndParams: (url: string, routingList: INavimi_KeyList<INavimi_Route>) => {routeItem: INavimi_Route, params: any};
}