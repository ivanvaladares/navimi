namespace __Navimi_State {

    let state: KeyList<any> = {};
    let prevState: KeyList<any> = {};
    let stateDiff: { [key: string]: boolean } = {};
    let stateWatchers: KeyList<any> = {};

    const getStateDiff = (keys: string[]): void => {
        keys.sort((a, b) => b.length - a.length).map(key => {
            if (!stateDiff[key]) {
                const sOld = __Navimi_Helpers.stringify(getState(key, prevState) || "");
                const sNew = __Navimi_Helpers.stringify(getState(key, state) || "");
                if (sOld !== sNew) {
                    stateDiff[key] = true;
                    //set upper keys as changed so we don't test them again
                    keys.map(upperKey => {
                        if (key !== upperKey && key.indexOf(upperKey) === 0) {
                            stateDiff[upperKey] = true;
                        }
                    });
                }
            }
        });
    };

    const invokeStateWatchers = __Navimi_Helpers.debounce((): void => {
        const keys = Object.keys(stateWatchers);
        const diff = Object.keys(stateDiff);
        stateDiff = {};
        keys.filter(key => diff.includes(key)).sort((a, b) => b.length - a.length).map(key => {
            Object.keys(stateWatchers[key]).map((cs: string) => {
                const sNew = getState(key);
                stateWatchers[key][cs] &&
                    stateWatchers[key][cs].map((cb: (state: any) => void) => cb && cb(sNew));
            });
        });
    }, 10);

    const mergeState = (state: any, newState: any): void => {
        if (newState instanceof Error) {
            newState = { 
                ...newState,
                message: newState.message,
                stack: newState.stack,
            };
        }
        const isObject = (item: any): boolean =>
            item && typeof item === 'object' && !Array.isArray(item) && item !== null;
        if (isObject(state) && isObject(newState)) {
            for (const key in newState) {
                if (isObject(newState[key])) {
                    !state[key] && Object.assign(state, { [key]: {} });
                    mergeState(state[key], newState[key]);
                } else {
                    Object.assign(state, { [key]: newState[key] });
                }
            }
        }
    };

    export const setState = (newState: KeyList<any>): void => {
        const observedKeys = Object.keys(stateWatchers);
        if (observedKeys.length > 0) {
            prevState = __Navimi_Helpers.cloneObject(state);
        }
        mergeState(state, newState);
        if (observedKeys.length > 0) {
            getStateDiff(observedKeys);
            invokeStateWatchers();
        }
    };

    export const getState = (key?: string, _state?: any): KeyList<any> => {
        const st = key ?
            key.split('.').reduce((v, k) => (v && v[k]) || undefined, _state || state) :
            _state || state;
        return st ? Object.freeze(__Navimi_Helpers.cloneObject(st)) : undefined;
    };

    export const watchState = (jsUrl: string, key: string, callback: (state: any) => void): void => {
        if (!key || !callback) {
            return;
        }
        if (!stateWatchers[key]) {
            stateWatchers[key] = {};
        }
        stateWatchers[key] = {
            ...stateWatchers[key],
            [jsUrl]: [
                ...(stateWatchers[key][jsUrl] || []),
                callback
            ]
        };
    };

    export const unwatchState = (jsUrl: string, key?: string | string[]): void => {
        const remove = (key: string): void => {
            stateWatchers[key][jsUrl] = undefined;
            delete stateWatchers[key][jsUrl];
            Object.keys(stateWatchers[key]).length === 0 &&
                delete stateWatchers[key];
        }

        if (key) {
            const keys = Array.isArray(key) ? key : [key];
            keys.map(id => {
                !stateWatchers[id] && (stateWatchers[id] = {});
                remove(id);
            });
            return;
        }

        Object.keys(stateWatchers).map(remove);
    };

}