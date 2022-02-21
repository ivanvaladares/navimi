namespace __Navimi_Fetch {

    let bustCache: string;

    export let loadErrors: { [key: string]: string } = {};
    
    export const init = (options: Options): void => {
        bustCache = options.bustCache;
    };

    export const fetchFile = (url: string, options?: RequestInit): Promise<string> => {
        return new Promise((resolve, reject) => {
            delete loadErrors[url];

            const requestUrl = url + (bustCache ? '?v=' + bustCache : '');

            //todo: add retry with options
            fetch(requestUrl, options)
                .then(async (data) => {
                    if (!data || !data.ok) {
                        const error = `Could not load the file! - ${url}`;
                        loadErrors[url] = error;
                        return reject(error);
                    }
                    resolve(await data.text());
                })
                .catch(ex => {
                    loadErrors[url] = ex.message;
                    reject(ex);
                });
                
        });

    };

}