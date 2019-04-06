import { declareActionCreater, createReducer, Action } from "../src";

let actions: Array<Action<string, object>> = [];

const simpleActionCreater = declareActionCreater("SIMPLE_ACTION");

const simpleAction = simpleActionCreater(); // expect: {type: "SIMPLE_ACTION"}

actions.push(simpleAction);

// if you need the type-string:
const SIMPLE_ACTION = simpleActionCreater.TYPE;

// if you need the Action-Type: 
type ISIMPLE_ACTION = ReturnType<typeof simpleActionCreater>;

const payloadActionCreater = declareActionCreater("PAYLOAD_ACTION", {} as { data: string });

const payloadAction = payloadActionCreater({ payload: { data: "instance" } }); // expect: {type: "PAYLOAD_ACTION", payload: { data: "instance" } }

actions.push(payloadAction);

const errorActionCreater = declareActionCreater("ERROR_ACTION", false, {} as { errordata: string });

const errorAction1 = errorActionCreater(); // expect: {type: "ERROR_ACTION"}

actions.push(errorAction1);

const errorAction2 = errorActionCreater({ error: { errordata: "instance" } }); // expect: {type: "ERROR_ACTION", error: { errordata: "instance" } }

actions.push(errorAction2);

const payloadOrErrorActionCreater = declareActionCreater("PAYLOAD_ERROR_ACTION", {} as { data: string }, {} as { errordata: string });

const payloadOrErrorAction1 = payloadOrErrorActionCreater({ payload: { data: "instance" } }); // expect: {type: "PAYLOAD_ERROR_ACTION", payload: { data: "instance" } }

actions.push(payloadOrErrorAction1);

const payloadOrErrorAction2 = payloadOrErrorActionCreater({ error: { errordata: "instance" } }); // expect: {type: "PAYLOAD_ERROR_ACTION", error: { errordata: "instance" } }

actions.push(payloadOrErrorAction2);

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
        // you can currently define error-reactions even if theres no error declared...
    },
    SIMPLE_ACTION: {
        onSuccess: externalDefinedReaction('SIMPLE_ACTION')
    },
})

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