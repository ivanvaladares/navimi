interface INavimi_Helpers {
    timeout: (ms: number) => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    debounce: (task: Function, wait: number) => () => void;
    // eslint-disable-next-line @typescript-eslint/ban-types
    throttle: (task: Function, wait: number, context: any) => () => void;
    getUrl: () => string;
    setTitle: (title: string) => void;
    setNavimiLinks: () => void;
    removeHash: (url: string) => string;
    stringify: (obj: any) => string;
    cloneObject: (obj: any) => INavimi_KeyList<any>;
    getRouteAndParams: (url: string, routingList: INavimi_KeyList<INavimi_Route>) => {routeItem: INavimi_Route, params: any};
}