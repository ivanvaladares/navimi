interface INavimi_State {
    init: (navimiHelpers: INavimi_Helpers) => void;
    setState: (newState: INavimi_KeyList<any>) => void;
    getState: (key?: string, _state?: any) => INavimi_KeyList<any>;
    watchState: (caller: object, key: string, callback: (state: any) => void) => void;
    unwatchState: (caller: object, key?: string | string[]) => void;
    clear: (key?: string | string[]) => void;
}