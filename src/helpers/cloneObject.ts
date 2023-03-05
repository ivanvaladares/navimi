export const cloneObject = <T extends Record<string, unknown> | unknown>(obj: T, clonedObjects = new Map<any, any>()): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Error) {
        return Object.assign(new Error(obj.message), { stack: obj.stack }) as T;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
        const clonedArray = obj.map((item) => cloneObject(item, clonedObjects));
        clonedObjects.set(obj, clonedArray);
        return clonedArray as unknown as T;
    }

    if (clonedObjects.has(obj)) {
        return clonedObjects.get(obj) as T;
    }

    const clonedObj = Object.create(Object.getPrototypeOf(obj));
    clonedObjects.set(obj, clonedObj);
    for (const [key, value] of Object.entries(obj)) {
        clonedObj[key] = cloneObject(value, clonedObjects);
    }
    return clonedObj as T;
};
