/**
 * Subscriber function type definition.
 */
export type Subscriber<T> = (newValue: T, oldValue: T) => void;
/**
 * ValueSetter function type definition.
 */
export type ValueSetter<T> = (currentValue: T) => T;
/**
 * Interface representing an observable state.
 */
export interface ObservableState<T> {
    /**
     * Gets the current value of the state.
     * @returns The current value.
     */
    get: () => T;
    /**
     * Sets a new value or computes a new value using a setter function.
     * @param newValue - The new value or a function to compute the new value.
     * @param immediate - If true, the update is triggered immediately.
     */
    set: (newValue: T | ValueSetter<T>, immediate?: boolean) => void;
    /**
     * Clears all subscribers.
     */
    clear: () => void;
    /**
     * Subscribes a new subscriber to the state changes.
     * @param subscriber - The subscriber function.
     * @returns A function to unsubscribe the subscriber.
     */
    subscribe: (subscriber: Subscriber<T>) => () => void;
    /**
     * Unsubscribes a subscriber from the state changes.
     * @param subscriber - The subscriber function.
     */
    unsubscribe: (subscriber: Subscriber<T>) => void;
}
/**
 * Creates an observable state with the given initial value.
 * @param initialValue - The initial value or a function to compute the initial value.
 * @returns The observable state.
 */
export declare function createObservable<T>(initialValue: T | (() => T)): ObservableState<T>;
/**
 * Creates a store with state and actions.
 * @param store - The initial store state or a function to compute the initial state.
 * @param actions - A function returning the actions for the store.
 * @returns The store with state and actions.
 */
export declare function createStore<S extends Record<string, any>, A extends Record<string, Function>>(store: S | (() => S), actions: (state: ObservableState<S>) => A): ObservableState<S> & A;
