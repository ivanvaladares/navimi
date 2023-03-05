export const getUrl = (): string => {
    const location = document.location;
    const matches = location.toString().match(/^[^#]*(#.+)$/);
    const hash = matches ? matches[1] : '';

    return [location.pathname, location.search, hash].join('');
};
