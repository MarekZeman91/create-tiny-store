# Create Tiny Store

A super tiny observable and store create tool.\
It offers the bare minimum for you to do what you want and what you need.

## Features
- 🚀 Simple function to create an **observable**
- 📦 Simple function to create a **store**
- 🔒 Uses **TypeScript** by default
- 🔄 **Debounced** state by default

## Quick links

Observable
- [createObservable](#create-observable)
- [Listen for observable changes](#listen-for-observable-changes)
- [Modify observable value](#modify-observable-value)

Store
- [createStore](#create-store)
- [Listen for store changes](#listen-for-store-changes)
- [Modify store value](#modify-store-value)
- [Advanced store example](#advanced-store-example)

&nbsp;\
&nbsp;\
&nbsp;

## Create observable
`createObservable( valueOrValueInitFunction )`

Observable can be created with basic value or a value init function.

```typescript
// simple value
const observableNum = createObservable(0);

// value init
const observableObj = createObservable(() => {
  return { fname: 'John', lname: 'Doe' };
});

// !!! FUNCTION AS VALUE IS NOT PERMITTED !!!
// !!! IT WILL BE USED AS THE VALUE INIT  !!!
const observable_INCORRECT = createObservable(e => {
  e.preventDefault();
});

const observable_CORRECT_AS_INIT = createObservable(() => {
  return e => e.preventDefault();
});
const observable_CORRECT_AS_OBJECT = createObservable({
  listener: e => e.preventDefault(),
});
```

## Listen for observable changes

`Observable.subscribe( (newValue, oldValue) => { ... } )`

Subscribe for changes.\
It also returns `unsubscribe` function.

```typescript
const observable = createObservable(...);
const subscriber = (newValue, oldValue) => {
  console.log({ newValue, oldValue });
};
const unsubscribe = observable.subscribe(subscriber);

// they are identical
observable.unsubscribe(subscriber);
unsubscribe();
```

## Modify observable value

`Observable.set( newValueOrSetterFunction, immediate )`

By default, all `set` are debounced.\
To force update use the `immediate`.

```typescript
observable.get(); // Output: X

observable.set('Y');
observable.set(state => state.toLowerCase());
observable.get(); // Output: X ... unchanged yet

// ... after debounce
observable.get(); // Output: Y

observable.set('Z', true);
observable.get(); // Output: Z
```

&nbsp;\
&nbsp;\
&nbsp;

## Create store

`createStore( stateOrStateInitFunction, actionsInitFunction )`

Store can be created with state or state init function and with actions init function.

You can define actions to get, set or basically do whatever you need with the store.

```typescript
const observableStore = createStore(
  // state or state init
  () => ({
    fname: 'John',
    lname: 'Doe',
  }),
  // state ... state.get, state.set, ...
  ({ get, set }) => ({
    setFirstName: (firstName, immediate = false) => {
      // using function, destructure oldState, update fname
      set(oldState => ({ ...oldState, fname: firstName }), immediate);
    },
    setLastName: (lastName, immediate = false) => {
      // using object, destructure state, update lname
      set({ ...get(), lname: lastName }, immediate);
    },
    setFullName: (firstName, lastName, immediate = false) => {
      // using new state, full replace
      set({ fname: firstName, lname: lastName }, immediate);
    },
  }),
);
```

## Listen for store changes

`Store.subscribe( (newValue, oldValue) => { ... } )`

Subscribe for changes.\
It also returns `unsubscribe` function.

```typescript
const observableStore = createStore(...);
const subscriber = (newValue, oldValue) => {
  console.log({ newValue, oldValue });
};
const unsubscribe = observableStore.subscribe(subscriber);

// they are identical
observableStore.unsubscribe(subscriber);
unsubscribe();
```

## Modify store value

`Store.set( newValueOrSetterFunction, immediate )`
`Store.customAction( ... )`

By default, all `set` are debounced.\
To force update use the `immediate`.

```typescript
// get whole store state
observableStore.get() // Output: { fname: 'John', lname: 'Doe' }

// NOT RECOMMENDED
// replace whole store state
observableStore.set({
  ...observableStore.get(),
  fname: 'Mary',
});

// store state is mutable but it DOES NOT trigger listeners
observableStore.get().fname = 'Mary';

// RECOMMENDED
observableStore.get().fname; // Output: John
observableStore.getFullName(); // Output: John Doe

// use actions defined in the store
observableStore.setFirstName('Jane');
observableStore.getFullName(); // Output: John Doe

observableStore.setFirstName('Mary', true);
observableStore.getFullName(); // Output: Mary Doe

observableStore.setFullName('Karen', 'Osborne', true);
observableStore.getFullName(); // Output: Karen Osborne
```

## Advanced store example

Example of async flow.

```typescript
interface Article {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface ArticleStore {
  isLoading: boolean;
  data: Article[];
  error: undefined | Error;
}

const articles = createStore(
  (): ArticleStore => ({
    isLoading: false,
    data: [],
    error: undefined,
  }),

  ({ get, set }) => {
    let abortController: AbortController | undefined;

    const setPartial = (newState: Partial<ArticleStore>) => {
      set({ ...get(), ...newState });
    };
    
    const cancel = () => {
      abortController?.abort();
    };

    const load = async () => {
      cancel();
      abortController = new AbortController();

      setPartial({ isLoading: true, error: undefined });

      try {
        const res = await fetch(
          'https://jsonplaceholder.typicode.com/posts',
          { signal: abortController.signal }
        );
        const json = await res.json();

        setPartial({ isLoading: false, data: json });
      } catch (error) {
        console.error(error);
        setPartial({ isLoading: false, error: error as Error });
      }
    };

    return { setPartial, cancel, load };
  },
);

articles.subscribe(console.log);
articles.load();
```

---

Built with ❤️ in TypeScript.
