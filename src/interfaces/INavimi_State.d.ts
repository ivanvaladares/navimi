interface INavimi_State {
    init: (navimiHelpers: INavimi_Helpers) => void;
    setState: (newState: INavimi_KeyList<any>) => void;
    getState: (key?: string, _state?: any) => INavimi_KeyList<any>;
    watchState: (jsUrl: string, key: string, callback: (state: any) => void) => void;
    unwatchState: (jsUrl: string, key?: string | string[]) => void;
}