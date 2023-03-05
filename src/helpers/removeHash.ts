export const removeHash = (url: string): string => {
    const hashPos = url.indexOf('#');
    return hashPos > 0 ? url.substring(0, hashPos) : url;
};
