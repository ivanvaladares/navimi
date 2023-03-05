declare class INavimi_State {
    init: () => void;
    setState: (newState: Record<string, any>) => void;
    getState: (key?: string, _state?: any) => Record<string, any>;
    watchState: (callerUid: string, key: string, callback: (state: any) => void) => void;
    unwatchState: (callerUid: string, key?: string | string[]) => void;
    clear: (key?: string | string[]) => void;
}

export { INavimi_State };
