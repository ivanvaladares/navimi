class __Navimi_Middleware implements INavimi_Middlewares {

    private _middlewareStack: INavimi_Middleware[] = [];

    public addMiddlewares = (middlewares: INavimi_Middleware[]): void => {
        if (Array.isArray(middlewares)) {
            this._middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
        }
    };

    public executeMiddlewares = async (abortController: AbortController, context: INavimi_Context, callback: (url: string, params: INavimi_KeyList<any>) => void): Promise<void> => {
        let prevIndex = -1;
        const runner = async (resolve: any, reject: any, index: number = 0): Promise<void> => {
            if (__NAVIMI_DEV) {
                if (index === prevIndex) {
                    console.warn('next() called multiple times');
                }
            }
            prevIndex = index;
            const middleware = this._middlewareStack[index];
            if (middleware) {
                await middleware(context, async (url: string, params?: INavimi_KeyList<any>) => {
                    if (abortController.signal.aborted) {
                        reject();
                    } else {
                        if (!url) {
                            await runner(resolve, reject, index + 1);
                        } else {
                            reject();
                            callback(url, params);
                        }
                    }
                });
            } else {
                resolve();
            }
        }
        await new Promise(await runner).catch(_ => { });
    };

}