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
 * Reads the value from a getter function or returns the value directly.
 * @param getter - The value or a function to compute the value.
 * @param state - Optional state to pass to the getter function.
 * @returns The computed or direct value.
 */
const readValue = <V, S>(
  getter: V | (() => V) | ((state: S) => V),
  state?: S,
): V => {
  try {
    return typeof getter === 'function' ? (getter as Function)(state) : getter;
  } catch (error) {
    console.error('Failed to read value:', { getter, state, error });
    return state as V;
  }
};

const enqueue =
  typeof requestAnimationFrame === 'undefined'
    ? setTimeout
    : requestAnimationFrame;
const dequeue =
  typeof cancelAnimationFrame === 'undefined'
    ? clearTimeout
    : cancelAnimationFrame;

/**
 * Creates an observable state with the given initial value.
 * @param initialValue - The initial value or a function to compute the initial value.
 * @returns The observable state.
 */
export function createObservable<T>(
  initialValue: T | (() => T),
): ObservableState<T> {
  initialValue = readValue(initialValue);

  let debounceId = 0;
  const subscribers: Set<Subscriber<T>> = new Set();
  const state = {
    current: initialValue,
    future: initialValue,
    queued: false,
  };

  const trigger = (): void => {
    if (!state.queued) return;
    state.queued = false;

    if (state.current === state.future) return;

    const oldValue = state.current;
    const newValue = state.future;
    state.current = newValue;
    emit(newValue, oldValue);
  };

  const get = (): T => state.current;

  const set = (newValue: T | ValueSetter<T>, immediate = false): void => {
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

  const clear = (): void => {
    subscribers.clear();
  };

  const subscribe = (subscriber: Subscriber<T>): (() => void) => {
    subscribers.add(subscriber);
    return () => unsubscribe(subscriber);
  };

  const unsubscribe = (subscriber: Subscriber<T>): void => {
    subscribers.delete(subscriber);
  };

  const emit = (newValue: T, oldValue: T): void => {
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
export function createStore<
  S extends Record<string, any>,
  A extends Record<string, Function>,
>(
  store: S | (() => S),
  actions: (state: ObservableState<S>) => A,
): ObservableState<S> & A {
  const state = createObservable(store);
  return { ...state, ...actions(state) };
}
