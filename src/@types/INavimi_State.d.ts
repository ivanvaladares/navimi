interface INavimi_State {
    init: (navimiHelpers: INavimi_Helpers) => void;
    setState: (newState: INavimi_KeyList<any>) => void;
    getState: (key?: string, _state?: any) => INavimi_KeyList<any>;
    watchState: (callerId: number, key: string, callback: (state: any) => void) => void;
    unwatchState: (callerId: number, key?: string | string[]) => void;
    clear: (key?: string | string[]) => void;
}