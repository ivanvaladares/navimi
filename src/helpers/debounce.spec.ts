import { debounce } from './debounce';

jest.useFakeTimers();

describe('debounce', () => {
    let task: jest.Mock;
    let debouncedTask: (...args: unknown[]) => void;

    beforeEach(() => {
        task = jest.fn();
        debouncedTask = debounce(task, 1000);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    test('executes task only once after debounce time', () => {
        debouncedTask(1, 2, 3);
        debouncedTask(4, 5, 6);
        debouncedTask(7, 8, 9);

        expect(task).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);

        expect(task).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith(7, 8, 9);
    });

    test('applies context correctly', () => {
        const context = { foo: 'bar' };
        debouncedTask = debounce(task.bind(context), 1000);

        debouncedTask(1, 2, 3);

        expect(task).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1000);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task.mock.instances[0]).toBe(context);
    });
    
});
