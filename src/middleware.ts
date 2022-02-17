namespace __Navimi_Middleware {
   
    let middlewareStack: Middleware[] = [];

    export let loadErrors: { [key: string]: any } = {};

    export const addMiddlewares = (middlewares: Middleware[]): void => {
        if (Array.isArray(middlewares)) {
           middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
        }
    };

    export const executeMiddlewares = async (abortController: AbortController, context: Context, callback: (url: string, params: any) => void): Promise<void> => {
        let prevIndex = -1;
        const runner = async (index: number, resolve: any, reject: any): Promise<void> => {
            if (index === prevIndex) {
                throw new Error('next() called multiple times')
            }
            prevIndex = index;
            const middleware = middlewareStack[index];
            if (middleware) {
                await middleware(context, (url: string, params?: { [key: string]: any }) => {
                    if (abortController.signal.aborted) {
                        reject();
                    } else {
                        if (!url) {
                            runner(index + 1, resolve, reject);
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
        await new Promise(async (resolve, reject) => {
            await runner(0, resolve, reject);
        });
    };

}