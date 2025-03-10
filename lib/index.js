/**
 * Reads the value from a getter function or returns the value directly.
 * @param getter - The value or a function to compute the value.
 * @param state - Optional state to pass to the getter function.
 * @returns The computed or direct value.
 */
const readValue = (getter, state) => {
    try {
        return typeof getter === 'function' ? getter(state) : getter;
    }
    catch (error) {
        console.error('Failed to read value:', { getter, state, error });
        return state;
    }
};
const enqueue = typeof requestAnimationFrame === 'undefined'
    ? setTimeout
    : requestAnimationFrame;
const dequeue = typeof cancelAnimationFrame === 'undefined'
    ? clearTimeout
    : cancelAnimationFrame;
/**
 * Creates an observable state with the given initial value.
 * @param initialValue - The initial value or a function to compute the initial value.
 * @returns The observable state.
 */
export function createObservable(initialValue) {
    initialValue = readValue(initialValue);
    let debounceId = 0;
    const subscribers = new Set();
    const state = {
        current: initialValue,
        future: initialValue,
        queued: false,
    };
    const trigger = () => {
        if (!state.queued)
            return;
        state.queued = false;
        if (state.current === state.future)
            return;
        const oldValue = state.current;
        const newValue = state.future;
        state.current = newValue;
        emit(newValue, oldValue);
    };
    const get = () => state.current;
    const set = (newValue, immediate = false) => {
        state.future = readValue(newValue, state.current);
        if (immediate) {
            dequeue(debounceId);
            state.queued = true;
            trigger();
            return;
        }
        if (!state.queued) {
            state.queued = true;
            debounceId = enqueue(trigger);
        }
    };
    const clear = () => {
        subscribers.clear();
    };
    const subscribe = (subscriber) => {
        subscribers.add(subscriber);
        return () => unsubscribe(subscriber);
    };
    const unsubscribe = (subscriber) => {
        subscribers.delete(subscriber);
    };
    const emit = (newValue, oldValue) => {
        for (const subscriber of subscribers) {
            subscriber(newValue, oldValue);
        }
    };
    return { get, set, clear, subscribe, unsubscribe };
}
/**
 * Creates a store with state and actions.
 * @param store - The initial store state or a function to compute the initial state.
 * @param actions - A function returning the actions for the store.
 * @returns The store with state and actions.
 */
export function createStore(store, actions) {
    const state = createObservable(store);
    return { ...state, ...actions(state) };
}
