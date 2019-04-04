import * as actionCreators from "./actionCreaters";
import { createReducer } from "../src/typedReduxUtils";
import * as actions from "./consumation";


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

const reducer = createReducer(initialState, {
    ...actionCreators
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
        // you can currently define error-reactions even if theres no error declared...
    },
    SIMPLE_ACTION: {
        onSuccess: externalDefinedReaction('SIMPLE_ACTION')
    },
})

let state: typeof initialState | undefined = undefined;

Object.keys(actions).map((key) => actions[key]).forEach((action) => state = reducer(state, action))

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