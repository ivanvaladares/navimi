namespace __Navimi_Fetch {

    export let loadErrors: { [key: string]: string } = {};

    export const fetchFile = (url: string, options?: RequestInit): Promise<string> => {
        return new Promise((resolve, reject) => {
            delete loadErrors[url];

            //todo: add retry
            fetch(url, options)
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