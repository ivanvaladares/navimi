namespace __Navimi_Middleware {
   
    let middlewareStack: Middleware[] = [];

    export const addMiddlewares = (middlewares: Middleware[]): void => {
        if (Array.isArray(middlewares)) {
           middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
        }
    };

    export const executeMiddlewares = async (abortController: AbortController, context: Context, callback: (url: string, params: { [key: string]: any }) => void): Promise<void> => {
        let prevIndex = -1;
        const runner = async (resolve: any, reject: any, index: number = 0): Promise<void> => {
            if (index === prevIndex) {
                console.warn('next() called multiple times');
            }
            prevIndex = index;
            const middleware = middlewareStack[index];
            if (middleware) {
                await middleware(context, async (url: string, params?: { [key: string]: any }) => {
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