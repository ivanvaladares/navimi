class _mock_fetch {
    constructor() {
        this.data = {};
    }

    fetch(url) {

        return new Promise((resolve, reject) => {
            if (this.data[url]) {
                resolve({
                    text: async () => { return Promise.resolve(this.data[url]); },
                    ok: true
                });
                return;
            }
            reject(new Error(`File ${url} not found`));
        });

    }
};

module.exports = _mock_fetch;