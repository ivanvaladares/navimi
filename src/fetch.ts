namespace __Navimi {

    export class Navimi_Fetch {

        private bustCache: string;
        private fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

        public loadErrors: { [key: string]: string } = {};
        
        public init = (options: Options, _fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>): void => {
            this.bustCache = options.bustCache;
            this.fetch = _fetch;
        };
    
        public fetchFile = (url: string, options?: RequestInit): Promise<string> => {
            return new Promise((resolve, reject) => {
                delete this.loadErrors[url];
    
                const requestUrl = url + (this.bustCache ? '?v=' + this.bustCache : '');
    
                //todo: add retry with options
                (this.fetch || fetch)(requestUrl, options)
                    .then(async (data: Response) => {
                        if (!data || !data.ok) {
                            const error = `Could not load the file! - ${url}`;
                            this.loadErrors[url] = error;
                            return reject(error);
                        }
                        resolve(await data.text());
                    })
                    .catch(ex => {
                        this.loadErrors[url] = ex.message;
                        reject(ex);
                    });
                    
            });
    
        };
    
    }

}