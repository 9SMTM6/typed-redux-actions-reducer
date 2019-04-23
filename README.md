# typed-redux-actions-reducer

[To be renamed to typed-redux-helpers](#feedback)

A package helping with the reduction of Boilerplate when combining Redux with Typescript. 

![TOTAL Downloads](https://img.shields.io/npm/dt/typed-redux-actions-reducer.svg)

**This is a Prototype**

An `action` created by the Action-Creaters is following the [Flux-Standard-Action](https://github.com/redux-utilities/flux-standard-action) with the optional `action.payload` and `action.error` fields (`action.meta` is not supported. If you can provide good arguments I may change that.).

Using Action-Creators build with `declareActionCreater` you can easily create an completely typed Reducer with `createReducer`. The defined Reactions only have to return the difference to the previous state, the rest is merged automatically.

Only tested with Redux 4 so far.

## Contents:

* [Usage](#usage)
    * [Of declareActionCreaters](#create-an-action-creater-and-its-usage)
        * [Embed these actions into an traditional Reducer](#embedding-an-action-into-an-traditional-code-like-a-traditional-reducer)
    * [Of createReducer](#creating-an-reducer-handling-the-actions-by-declared-action-creaters)
* [Motivation](#motivation)
    * [For declareActionCreater](#action-creaters)
    * [For createReducer](#create-reducer)
* [Feedback](#feedback)
* [TODO](#todo)
* [Alternatives](#alternatives)
* [Credits](#credits)

## Usage

See also src/usage on Github

### Create an Action-Creater and its usage

A simple action without payload:
```ts
const simpleActionCreater = declareActionCreater("SIMPLE_ACTION");

const simpleAction = simpleActionCreater(); // expect: {type: "SIMPLE_ACTION"}
```
The created Action-Creater not only works as a function, but also as an object which has an TYPE-Field, which holds the type-String.

An action with payload
```ts
const payloadActionCreater = declareActionCreater("PAYLOAD_ACTION", {} as { data: string });

const payloadAction = payloadActionCreater({ payload: { data: "instance" } }); // expect: {type: "PAYLOAD_ACTION", payload: { data: "instance" } }
```
The argument of the ActionCreater is type-tested.

A simple action which can also have errors:

```ts
const errorActionCreater = declareActionCreater("ERROR_ACTION", false, {} as { errordata: string });

const errorAction1 = errorActionCreater(); // expect: {type: "ERROR_ACTION"}

const errorAction2 = errorActionCreater({ error: { errordata: "instance" } }); // expect: {type: "ERROR_ACTION", error: { errordata: "instance" } }
```
The Error-Case is also Type-Tested


An action with payload which can also have errors:

```ts
const payloadOrErrorActionCreater = declareActionCreater("PAYLOAD_ERROR_ACTION", {} as { data: string }, {} as { errordata: string });

const payloadOrErrorAction1 = payloadOrErrorActionCreater({ payload: { data: "instance" } }); // expect: {type: "PAYLOAD_ERROR_ACTION", payload: { data: "instance" } }

const payloadOrErrorAction2 = payloadOrErrorActionCreater({ error: { errordata: "instance" } }); // expect: {type: "PAYLOAD_ERROR_ACTION", error: { errordata: "instance" } }
```
Error or Payload argument are both type-tested.

#### Embedding an action into an traditional code like a traditional reducer

**I recommend a to create the reducer with the inhouse [`createReducer`](#creating-an-reducer-handling-the-actions-by-declared-Action-Creaters) unless you want to handle legacy actions and ones by this package in the same reducer**

```ts
// if you need the type-string:
const SIMPLE_ACTION = simpleActionCreater.TYPE;

// if you need the Action-Type: 
type ISIMPLE_ACTION = ReturnType<typeof simpleActionCreater>;
```

This works for all the actions created by `declareActionCreater`.

### Creating an reducer handling the actions by declared Action-Creaters

What sets this Package apart from others is not the declaration of Action-Creaters, theres [other packages](https://github.com/piotrwitek/typesafe-actions) that handle this gracefully.

Its the ease of creating fully typed reducers using these Action(-Creaters). To do so you need only provide the type of actions, represented by the action-creators, and the state - and initial state - of the reducer.

You can, dont have to though, write an explicit reaction to the error case. Default reaction is to console.error the action.type and keep the state as-is.

The handled action-creators currently have a quite strict type requirement, maybe I can widen that but that is not a priority for me right now. Thus I recommend to only handle Action-Creaters created with the inhouse `declareActionCreater` with `createReducer`.

```ts
const initialState: {
    registeredActions: Array<{
        type: string,
        payload: object | undefined,
    }>
    registeredErrors: Array<{
        type: string,
        error: object | undefined,
    }>
} = {
    registeredActions: [],
    registeredErrors: [],
}

const reducer = createReducer(initialState, {
    simpleActionCreater,
    payloadActionCreater,
    errorActionCreater,
    payloadOrErrorActionCreater
})({
    PAYLOAD_ERROR_ACTION: { //suggested way to define the reactions
        onSuccess: (state, payload) => {
            const registeredActions = [...state.registeredActions, {
                type: 'PAYLOAD_ERROR_ACTION',
                payload,
            }]
            return {
                registeredActions,
            }
        },
        onError: (state, error) => {
            const registeredErrors = [...state.registeredErrors, {
                type: 'PAYLOAD_ERROR_ACTION',
                error,
            }]
            return {
                registeredErrors,
            }
        }
    },
    ERROR_ACTION: {// you can of course also use predeclared functions, though the right typing can be tricky and verbose in that case
        onSuccess: externalDefinedReaction('ERROR_ACTION'), 
        // note the lack of an error-case, meaning default error action (console.erroring and keeping state as-is)
    },
    PAYLOAD_ACTION: {
        onSuccess: externalDefinedReaction('PAYLOAD_ACTION'),
        onError: externalDefinedErrorReaction('PAYLOAD_ACTION'),
        // you can currently define error-reactions even if theres no error declared... probably gonna remove that sonner or later.
    },
    SIMPLE_ACTION: {
        onSuccess: externalDefinedReaction('SIMPLE_ACTION')
    },
})
```

With:

```ts
/** Small helper function to generate a simular reaction for every action-Creater */
const externalDefinedReaction = (type: string) => (state: typeof initialState, payload?: object): Partial<typeof initialState> => {
    return {
        registeredActions: [...state.registeredActions, {
            type,
            payload,
        }],
    }
}

/** See `externalDefinedReaction` */
const externalDefinedErrorReaction = (type: string) => (state: typeof initialState, error?: object): Partial<typeof initialState> => {
    return {
        registeredErrors: [...state.registeredErrors, {
            type,
            error,
        }],
    }
}
```

Typescript will check whether you handle all cases and if your return value is legitimate, this package provides a default reaction in the error-case (console.error and keep state as-is) and merges the return with the rest of the state, as well as providing an interface compatible with redux-standards - i.e. returning the initial state modified by the given action when state is set to undefined - and strictFunctionTypes. All of this while minimizing performance overhead as much as possible.

Here is a test-result of the above reducer, using the actions created in [this section](#create-an-action-creater-and-its-usage):

```ts
let state: typeof initialState | undefined = undefined;

actions.forEach((action) => state = reducer(state, action))

console.log(JSON.stringify(state))// expect: 
const result = {
    "registeredActions": [
        { "type": "SIMPLE_ACTION" },
        { "type": "PAYLOAD_ACTION", "payload": { "data": "instance" } },
        { "type": "ERROR_ACTION" },
        { "type": "PAYLOAD_ERROR_ACTION", "payload": { "data": "instance" } }],
    "registeredErrors": [
        { "type": "PAYLOAD_ERROR_ACTION", "error": { "errordata": "instance" } }
        // no 'ERROR_ACTION' error cause of no custom Error-Reaction!
    ]
}
```

## Motivation

### Action-Creaters

If you think about it Parts of the usual usage of Redux and Typescript really have the same Purpose. When you declare your `'ACTION_TYPE'` and an Action Creater: 

```ts
const ACTION_TYPE = 'ACTION_TYPE';

const actionCreater = (param1: DefinedType, param2: OtherType) => {
    return {
        type: ACTION_TYPE,
        payload: {
            param1,
            param2,
        }
    }
};
```

Youre really doing one big type-declaration. You say 'If I start this Action I expect it to have accompanying data of the shape `{param1: DefinedType, param2: OtherType}`'. Because `ReturnType` is relatively new I even see lots of people explicitly defining the ActionType again. Meaning you have 3 different 'declarations' connected to just one action. 
* The String of the action
* The arguments the Action-Creater takes
* The concrete shape you expect the action to have in the end.

When you conbine a fragmenting Redux and Typescript-Style you can spread the state management of one single part of the state over more than 5 files.

Seperating concerns can have a purpose, but in these cases its not making things easier, except if keep a mental image of whole Apps State-Management, something pretty much impossible in large projects.

I've also seen people - and I myself have also done it by mistake - building a complex payload IN the Action-Creater, sometimes having multiple Action-Creaters creating the same type of Action. Thats not really the idea though, if you have radically different data that should be merged in the state PLEASE dont spread the building of the state over different functions and files (the Action-Creater and the Reducer), but make a different action instead!

Another thing I prefer is not to have seperate Actions for the Action or the case of an error. These should be the same Actions really.

The Action-Creators in this package are meant to plug into existing state management without larger problems but collect the Type-Declarations in one place, as well as supporting error handling in one action and enforcing that the Creation of an Action is not doing part of the State-Building itself. To do that in a unified fashion the creation of an Action is a bit more verbose than with other approaches, but because of the provided type information IDEs will offer a lot of Autocompletion, leading to simular amounts of total writing.

### Create-Reducer

Typing a reducer correctly isnt neccesarily easy. If you dont want to work with a lot of Type-Assertion - that classically you'd have to import not only the - you need proper Mapped Types that map the Type of `action.type` to the type of `action.payload` and `action.error`. To do that you also need to ensure that the Type of `action.type` doesnt widen from a string-literal to a string, loosing the ability to get the complete type of the action by switch-case.

The best way I found to do that is to use a Union of the Action-Types, ensuring that the Type of `action.type` isnt widend by using `'ACTION_TYPE' as 'ACTION_TYPE'`. But even so you need to manually keep track of the action types, create the Union type, and with the newer "strictFunctionTypes" flag Typescript does even complain when you declare an action to be of the union type. And thats actually right, if you think about it, as you could create another Action that has the same `action.type` but other payload, and that would lead to type errors.

But you need to widen the allowed action types of the reducers eventually if you want to use standard redux tooling.

You see, theres a lot of issues you potentially face when you want to create a typesafe reducer, leading to a certain amount of boilerplate and lots of people just giving up and using type assertion.

This packackage aims to make an reducer that is completely typed (it provides payload, error and state type, and checks the return). It also should have as minimal boilerplate as possible while: 
* doing standardized error-handling with the same action
* being compatible with strictFunctionTypes.
    * Though it has the described potential issue without strictFunctionTypes. 
* all that while providing a visual (and also implemented) control flow simular to the usual switch-case reducers
    * meaning `action.type`-'Cases' with the reactions in them, automatically merging the return in the state.
* having minimal performance overhead

## Feedback

**WIP**

I'm open for all suggestions, but I'm really interested in a few aspects (till I figure out a better way of communication by Github issues it is):

* Is there any arguments to be made against decrepitation of the 'typed-redux-actions-reducer' npm package to switch to the name 'typed-redux-helpers'? I'd like to do that early in the lifecycle.
* Is there interest in a simple project where I show ways to create a typed reducer without the need for an additional package?
* Is there interest in a Builder which registers a store and returns a Variation of declareActionCreater that automatically dispatches
* Should I maybe handle errors differently, always allowing to dispatch an error with `actionCreater({error: {}})`? I would also add the option to do `actionCreater({payload: {}})` as alternative to just `actionCreater()` in that case.
* ...more stuff I cant list right now.

## TODO:

1. complete type tests with dtslint
1. Switch types to easier format with less declared types
1. while doing that add tha ability to always dispatch errors
1. add subfolder import path for actioncreater/ reducer pair without the error-handling and its boilerplate

## Alternatives

**WIP**

I recommend anyone new to/ willing to improve his handling of the combination Typescript, React and Redux to read [this Guide](https://github.com/piotrwitek/react-redux-typescript-guide).


## Credits

* Thanks a lot to [Piotr Lewandowski](https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c) for showing me whats possible with Typescripts conditional Types. Without a trick he shows in this article I would probably not have been able to create a fully typed dictionary using the type of the action and not the name of the Actioncreater.
* Also thanks to [Marius Schulz](https://mariusschulz.com/blog/series/typescript-evolution). His blog was a good reference for correct Syntax of newer Typescript features not mentioned in the - very old - official Typescript documentation.
