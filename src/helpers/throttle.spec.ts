import { throttle } from './throttle';

jest.useFakeTimers();

describe('throttle', () => {
    let task: jest.Mock;
    let throttledTask: (...args: unknown[]) => void;

    beforeEach(() => {
        task = jest.fn();
        throttledTask = throttle(task, 1000, null);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    test('executes task immediately on first call', () => {
        throttledTask(1, 2, 3);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith(1, 2, 3);
    });

    test('executes task only once during throttle time', () => {
        throttledTask(1, 2, 3);
        throttledTask(4, 5, 6);
        throttledTask(7, 8, 9);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith(1, 2, 3);

        jest.advanceTimersByTime(500);

        expect(task).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(500);

        expect(task).toHaveBeenCalledTimes(2);
        expect(task).toHaveBeenCalledWith(7, 8, 9);
    });

    test('executes task again after throttle time', () => {
        throttledTask(1, 2, 3);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith(1, 2, 3);

        jest.advanceTimersByTime(1000);

        throttledTask(4, 5, 6);

        expect(task).toHaveBeenCalledTimes(2);
        expect(task).toHaveBeenCalledWith(4, 5, 6);
    });

    test('applies context correctly', () => {
        const context = { foo: 'bar' };
        throttledTask = throttle(task, 1000, context);

        throttledTask(1, 2, 3);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith(1, 2, 3);
        expect(task.mock.instances[0]).toBe(context);
    });
    
});
