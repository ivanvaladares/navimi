class FakeFetch {
    constructor() {
        this.data = {};
    }

    fetchFile(url) {
        if (this.data[url]) {
            return Promise.resolve(this.data[url]);
        }

        return Promise.reject(new Error(`File ${url} not found`));
    }
};

module.exports = FakeFetch;