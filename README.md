# typed-redux-actions-reducer
A framework helping with the reduction of Boilerplate when combining Redux with Typescript. 

**This is an Prototype**

An `action` created by the Action-Creaters is following the [Flux-Standard-Action](https://github.com/redux-utilities/flux-standard-action) with the optional `action.payload` and `action.error` fields (`action-meta` is not supported so far).

Using Action-Creators build with `declareActionCreator` you can easily create an completely typed Reducer with `createReducer`. The defined Reactions only have to return the difference to the previous state, the rest is merged automatically.

Only tested with Redux 4 so far.

## Contents:

* [Motivation](#Motivation)
    * [For declareActionCreater](#Action-Creaters)
    * [For createReducer](#Create-Reducer)
* [Usage](#Usage)
    * [Of declareActionCreaters](#Create-an-Action-Creater-and-its-usage)
    * [Of createReducer](#Creating-an-reducer-handling-the-actions-by-declared-Action-Creators)
* [Alternatives](#Alternatives)
* [Credits](#Credits)

## Motivation:

### Action-Creaters:

If you think about it Parts of the usual usage of Redux and Typescript really have the same Purpose. When you declare your `'ACTION_TYPE'` and an Action Creater: 

```ts
const ACTION_TYPE = 'ACTION_TYPE';

const actionCreator = (param1: DefinedType, param2: OtherType) => {
    return {
        type: ACTION_TYPE,
        payload: {
            param1,
            param2,
        }
    }
};
```

Youre really doing one big Type-Declaration. You say 'If I start this Action I expect it to have accompanying data of the shape `{param1: DefinedType, param2: OtherType}`'. Because `ReturnType` is relatively new I even see lots of people explicitly defining the ActionType again. Meaning you have 3 different 'declarations' connected to just one action. 
* The String of the action
* The arguments the Action-Creater takes
* The concrete shape you expect the action to have in the end.

In some extreme cases a lot fo these deklarations are even in a seperate type file with other simular deklarations, meaning with the already fragmenting Redux and a fragmenting Typescript-Style you can spread the state management of one single instance over more than 5 files.

I've also seen people building a complex payload IN the Action-Creater, sometimes having multiple Action-Creaters creating the same type of Action. Thats not really the idea though, if you have radically different data that should be merged in the state PLEASE dont spread the building of the state over different functions (the Action-Creater and the Reducer), but make a different action instead!

Another thing I prefer is not to have seperate Actions for the Action or the case of an error. These should be the same Actions really.

The Action-Creators in this package are meant to plug into existing state management without larger problems but collect the Type-Declarations in one place, as well as supporting error handling in one action and enforcing that the Creation of an Action is not doing part of the State-Building itself. To do that in a unified fashion the creation of an Action is a bit more verbose than with other approaches, but because of the provided type information IDEs will offer a lot of Autocompletion, leading to simular amounts of total writing.

### Create-Reducer:

Typing a reducer correctly isnt neccesarily easy. If you dont want to work with a lot of Type-Assertion - that classically you'd have to import not only the - you need proper Mapped Types that map the Type of `action.type` to the type of `action.payload` and `action.error`. To do that you also need to ensure that the Type of `action.type` doesnt widen from a string-literal to a string, loosing the ability to get the complete type of the action by switch-case.

The best way I found to do that is to use a Union of the Action-Types, ensuring that the Type of `action.type` isnt widend by using `'ACTION_TYPE' as 'ACTION_TYPE'`. But even so you need to manually keep track of the action types, create the Union type, and with the newer "strictFunctionTypes" flag Typescript does even complain when you declare an action to be of the union type. And thats actually right, if you think about it, as you could create another Action that has the same `action.type` but other payload, and that would lead to type errors.

But you need to widen the allowed action types of the reducers eventually if you want to use standard redux tooling.

You see, theres a lot of potential issues you face when you want to create a typesafe reducer, leading to a certain amount of boilerplate and lots of people just giving up and using type assertion.

This packackage aims to make an reducer that is completely typed (it provides payload, error and state type, and checks the return). It also should have minimal boilerplate as possible with standardized error-handling with the same action and be compatible with strictFunctionTypes. Though it has the described potential issue without strictFunctionTypes. All that while providing a visual (and also implemented) control flow simular to the usual switch-case reducers, meaning `action.type`--'Cases' with the reactions and minimal performance overhead, as well as merging the return, which needs only be part of the state, with the state.

## Usage:

See also src/usage.ts

### Create an Action-Creater and its usage:

A simple action without payload:
```ts
const simpleActionCreater = declareActionCreater("SIMPLE_ACTION");

const simpleAction = simpleActionCreater(); // expect: {type: "SIMPLE_ACTION"}

// if you need the type-string:
const SIMPLE_ACTION = simpleAction.TYPE;
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

### Creating an reducer handling the actions by declared Action-Creators:

What sets this Package apart from others is not the declaration of Action-Creaters, theres [other packages](https://github.com/piotrwitek/typesafe-actions) that handle this gracefully.

Its the ease of creating fully typed reducers using these Action(-Creaters). To do so you need only provide the type of actions, represented by the action-creators, and the state - and initial state - of the reducer.

Typescript will check whether you handle all cases and if your return value is legitimate, this package provides a default reaction in the error-case (console.error and keep state as-is) and merges the return with the rest of the state, as well as providing an interface compatible with redux-standards - i.e. returning the initial state modified by the given action when state is set to undefined - and strictFunctionTypes. All of this while minimizing performance overhead as much as possible.

## Alternatives

I recommend anyone new to/ willing to Improve his handling of the COmbination Typescript, React and Redux to read [this Guide](https://github.com/piotrwitek/react-redux-typescript-guide).


## Credits:

* Thanks a lot to [Piotr Lewandowski](https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c) for showing me whats possible with Typescripts conditional Types. Without a trick he shows in this article I would probably not have been able to create a fully typed dictionary using the type of the action and not the name of the Actioncreater.
* Also thanks to [Marius Schulz](https://mariusschulz.com/blog/series/typescript-evolution). His blog was a good reference for correct Syntax of newer Typescript features not mentioned in the - very old - official Typescript documentation.
