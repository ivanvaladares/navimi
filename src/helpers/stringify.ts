export const stringify = (obj: any) => {
    const visited = new Map<any, number>();
    let index = 0;

    const iterateObject = (obj: any): any => {
        if (typeof obj === 'function') {
            return String(obj);
        }

        if (obj instanceof Error) {
            return obj.message;
        }

        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (visited.has(obj)) {
            return `[Circular: ${visited.get(obj)}]`;
        }

        visited.set(obj, index++);

        if (Array.isArray(obj)) {
            const aResult = obj.map(iterateObject);
            visited.delete(obj);
            return aResult;
        }

        const result = Object.keys(obj).reduce((result: any, prop: string) => {
            result[prop] = iterateObject(((obj, prop) => {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    try {
                        return obj[prop];
                    } catch {
                        return;
                    }
                }
                return obj[prop];
            })(obj, prop));
            return result;
        }, {});

        visited.delete(obj);

        return result;
    };

    return JSON.stringify(iterateObject(obj));
};
