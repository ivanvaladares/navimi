class __Navimi_State implements INavimi_State {

    private _state: INavimi_KeyList<any> = {};
    private _stateWatchers: INavimi_KeyList<any> = {};
    private _prevState: INavimi_KeyList<any> = {};
    private _stateDiff: INavimi_KeyList<boolean> = {};
    private _uidCounter: number;
    private _navimiHelpers: INavimi_Helpers = {} as any;

    private _invokeStateWatchers: () => void;

    public init(navimiHelpers: INavimi_Helpers): void {
        this._navimiHelpers = navimiHelpers;

        this._uidCounter = 0;

        // debounce this so we fire in batches
        this._invokeStateWatchers = navimiHelpers.debounce((): void => {
            const keys = Object.keys(this._stateWatchers);
            const diff = Object.keys(this._stateDiff);
            this._stateDiff = {};
            // fire deep keys first
            keys.filter(key => diff.indexOf(key) >= 0).sort((a, b) => b.length - a.length).map(key => {
                Object.keys(this._stateWatchers[key]).map((jsUrl: string) => {
                    const state = this.getState(key);
                    this._stateWatchers[key][jsUrl] &&
                        this._stateWatchers[key][jsUrl].map((cb: (state: any) => void) => cb && 
                            cb(state));
                });
            });
        }, 10);
    }

    private _getStateDiff = (keys: string[]): void => {
        //start with longer keys to go deep first
        keys.sort((a, b) => b.length - a.length).map(key => {
            if (!this._stateDiff[key]) {
                const sOld = this._navimiHelpers.stringify(this.getState(key, this._prevState) || "");
                const sNew = this._navimiHelpers.stringify(this.getState(key, this._state) || "");
                if (sOld !== sNew) {
                    this._stateDiff[key] = true;
                    //set upper keys as changed so we don't test them again
                    keys.map(upperKey => {
                        if (key !== upperKey && key.indexOf(upperKey) === 0) {
                            this._stateDiff[upperKey] = true;
                        }
                    });
                }
            }
        });
    };

    private _mergeState = (state: any, newState: any): void => {
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
                    this._mergeState(state[key], newState[key]);
                } else {
                    Object.assign(state, { [key]: newState[key] });
                }
            }
        }
    };

    private _getCallerUid = (caller: InstanceType<any>): string => {
        if (caller.___navimiUid === undefined) {
            caller.___navimiUid = `uid:${++this._uidCounter}`;
        }
        return caller.___navimiUid;
    };

    public setState = (newState: INavimi_KeyList<any>): void => {
        const observedKeys = Object.keys(this._stateWatchers);
        if (observedKeys.length > 0) {
            this._prevState = this._navimiHelpers.cloneObject(this._state);
        }
        this._mergeState(this._state, newState);
        if (observedKeys.length > 0) {
            this._getStateDiff(observedKeys);
            this._invokeStateWatchers();
        }
    };

    public getState = (key?: string, _state?: any): INavimi_KeyList<any> => {
        const state = key ?
            key.split('.')
                .reduce((v, k) => (v && v[k]) || undefined, _state || this._state) :
            _state || this._state;
        return state ? Object.freeze(this._navimiHelpers.cloneObject(state)) : undefined;
    };

    public watchState = (caller: InstanceType<any>, key: string, callback: (state: any) => void): void => {
        if (!key || !callback) {
            return;
        }
        const uid = this._getCallerUid(caller);
        if (!this._stateWatchers[key]) {
            this._stateWatchers[key] = {};
        }
        this._stateWatchers[key] = {
            ...this._stateWatchers[key],
            [uid]: [
                ...(this._stateWatchers[key][uid] || []),
                callback
            ]
        };
    };

    public unwatchState = (caller: InstanceType<any>, key?: string | string[]): void => {
        const uid = this._getCallerUid(caller);
        const remove = (key: string): void => {
            this._stateWatchers[key][uid] = undefined;
            delete this._stateWatchers[key][uid];
            Object.keys(this._stateWatchers[key]).length === 0 &&
                delete this._stateWatchers[key];
        }

        if (key) {
            const keys = Array.isArray(key) ? key : [key];
            keys.map(id => {
                !this._stateWatchers[id] && (this._stateWatchers[id] = {});
                remove(id);
            });
            return;
        }

        Object.keys(this._stateWatchers).map(remove);
    };

    public clear = (key?: string | string[]): void => {
        const keys = Array.isArray(key) ? key : [key ? key : ''];

        keys.map(id => {
            const state = id ?
            id.split('.')
                    .reduce((v, k) => (v && v[k]) || undefined, this._state) : 
                this._state;

            if (state instanceof Object) {
                Object.keys(state).map(sk => {
                    if (state[sk] instanceof Object && 
                        Object.keys(state[sk]).length > 0) {
                        this.clear((id ? id + '.' : '') + sk);
                    }
                    delete state[sk];
                });
            }
        });
    }

}

//removeIf(dist)
module.exports.state = __Navimi_State;
//endRemoveIf(dist)