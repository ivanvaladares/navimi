class __Navimi_State implements INavimi_State {

    private state: INavimi_KeyList<any> = {};
    private stateWatchers: INavimi_KeyList<any> = {};
    private prevState: INavimi_KeyList<any> = {};
    private stateDiff: INavimi_KeyList<boolean> = {};
    
    private _navimiHelpers: INavimi_Helpers = {} as any;

    private invokeStateWatchers: () => void;

    public init(navimiHelpers: INavimi_Helpers): void {
        this._navimiHelpers = navimiHelpers;

        this.invokeStateWatchers = navimiHelpers.debounce((): void => {
            const keys = Object.keys(this.stateWatchers);
            const diff = Object.keys(this.stateDiff);
            this.stateDiff = {};
            keys.filter(key => diff.includes(key)).sort((a, b) => b.length - a.length).map(key => {
                Object.keys(this.stateWatchers[key]).map((cs: string) => {
                    const sNew = this.getState(key);
                    this.stateWatchers[key][cs] &&
                        this.stateWatchers[key][cs].map((cb: (state: any) => void) => cb && cb(sNew));
                });
            });
        }, 10);
    }

    private getStateDiff = (keys: string[]): void => {
        keys.sort((a, b) => b.length - a.length).map(key => {
            if (!this.stateDiff[key]) {
                const sOld = this._navimiHelpers.stringify(this.getState(key, this.prevState) || "");
                const sNew = this._navimiHelpers.stringify(this.getState(key, this.state) || "");
                if (sOld !== sNew) {
                    this.stateDiff[key] = true;
                    //set upper keys as changed so we don't test them again
                    keys.map(upperKey => {
                        if (key !== upperKey && key.indexOf(upperKey) === 0) {
                            this.stateDiff[upperKey] = true;
                        }
                    });
                }
            }
        });
    };

    private mergeState = (state: any, newState: any): void => {
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
                    this.mergeState(state[key], newState[key]);
                } else {
                    Object.assign(state, { [key]: newState[key] });
                }
            }
        }
    };

    public setState = (newState: INavimi_KeyList<any>): void => {
        const observedKeys = Object.keys(this.stateWatchers);
        if (observedKeys.length > 0) {
            this.prevState = this._navimiHelpers.cloneObject(this.state);
        }
        this.mergeState(this.state, newState);
        if (observedKeys.length > 0) {
            this.getStateDiff(observedKeys);
            this.invokeStateWatchers();
        }
    };

    public getState = (key?: string, _state?: any): INavimi_KeyList<any> => {
        const st = key ?
            key.split('.').reduce((v, k) => (v && v[k]) || undefined, _state || this.state) :
            _state || this.state;
        return st ? Object.freeze(this._navimiHelpers.cloneObject(st)) : undefined;
    };

    public watchState = (jsUrl: string, key: string, callback: (state: any) => void): void => {
        if (!key || !callback) {
            return;
        }
        if (!this.stateWatchers[key]) {
            this.stateWatchers[key] = {};
        }
        this.stateWatchers[key] = {
            ...this.stateWatchers[key],
            [jsUrl]: [
                ...(this.stateWatchers[key][jsUrl] || []),
                callback
            ]
        };
    };

    public unwatchState = (jsUrl: string, key?: string | string[]): void => {
        const remove = (key: string): void => {
            this.stateWatchers[key][jsUrl] = undefined;
            delete this.stateWatchers[key][jsUrl];
            Object.keys(this.stateWatchers[key]).length === 0 &&
                delete this.stateWatchers[key];
        }

        if (key) {
            const keys = Array.isArray(key) ? key : [key];
            keys.map(id => {
                !this.stateWatchers[id] && (this.stateWatchers[id] = {});
                remove(id);
            });
            return;
        }

        Object.keys(this.stateWatchers).map(remove);
    };

}