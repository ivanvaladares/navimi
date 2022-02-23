namespace __Navimi {

    export class Navimi_Middleware {

        private middlewareStack: Middleware[] = [];

        public addMiddlewares = (middlewares: Middleware[]): void => {
            if (Array.isArray(middlewares)) {
                this.middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
            }
        };

        public executeMiddlewares = async (abortController: AbortController, context: Context, callback: (url: string, params: KeyList<any>) => void): Promise<void> => {
            let prevIndex = -1;
            const runner = async (resolve: any, reject: any, index: number = 0): Promise<void> => {
                if (__NAVIMI_DEV) {
                    if (index === prevIndex) {
                        console.warn('next() called multiple times');
                    }
                }
                prevIndex = index;
                const middleware = this.middlewareStack[index];
                if (middleware) {
                    await middleware(context, async (url: string, params?: KeyList<any>) => {
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
}