class _mock_NavimiFetch {
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

module.exports = _mock_NavimiFetch;