import { declareActionCreater, createReducer, ActionCreator, Action } from "./typedReduxUtils";

const newActionCreater = declareActionCreater(
    'NEW_ACTION',
    {} as {
        param1: boolean,
        param2: {
            fdghser: string
        }
    },
    false
)

const newAction = newActionCreater({
    payload: {
        param1: true,
        param2: {
            fdghser: '5'
        }
    }
})

const onlyMessage = declareActionCreater('ONLY_MESSAGE');

const withPayload = declareActionCreater(
    'WITH_PAYLOAD',
    {} as {
        somedata: string
    },
    false);

const withErrorhandling = declareActionCreater('WITH_ERRORHANDLING', false, {} as { msg: string });

const withBoth = declareActionCreater(
    'WITH_PAYLOAD_OR_ERROR',
    {} as {
        otherload: { num: number }
    },
    {} as {
        msg: string
    });

let exampleInit = {
    flag: false,
    text: 'Initial filling'
};

const reducerOld = createReducer(exampleInit, { withPayload, withErrorhandling, withBoth, onlyMessage })({
    WITH_ERRORHANDLING: {
        onSuccess: (state) => {
            return {};
        },
    },
    WITH_PAYLOAD: {
        onSuccess: (state, payload) => {
            return state;
        },
    },
    ONLY_MESSAGE: {
        onSuccess: (state) => {
            return {};
        }
    },
    WITH_PAYLOAD_OR_ERROR: {
        onSuccess: (state, payload) => {
            return {
                text: String(payload.otherload.num + 2)
            };
        },
        onError: (state, error) => {
            console.log('encountered error');
            return {
                text: 'now Reset with ' + error.msg
            };
        }
    }
})

let exampleState = reducerOld(undefined, { type: 'INIT' });

console.log('before', exampleState);
exampleState = reducerOld(exampleState, withBoth({ payload: { otherload: { num: 5 } } }));
console.log('after fitting', exampleState);
exampleState = reducerOld(exampleState, { type: 'OTHER_ACTION', error: { msg: 'Shouldnt do a thing' } });
console.log('after unfitting', exampleState);
exampleState = reducerOld(exampleState, withBoth({ error: { msg: 'does this work?' } }));
console.log('after error', exampleState);
exampleState = reducerOld(exampleState, { type: 'WITH_PAYLOAD', error: { msg: 'does this work?' } });
console.log('after error 2', exampleState);

let exampleState2 = reducerOld(undefined, { type: 'OTHER_ACTION', error: { msg: 'Shouldnt do a thing' } });
console.log(exampleState2)

exampleState2 = reducerOld(exampleState2, withBoth({ payload: { otherload: { num: 2 } } }))
console.log(exampleState2)

// --------------------- readme-usage-code 

let actions: Array<Action<string, object>> = [];

const simpleActionCreater = declareActionCreater("SIMPLE_ACTION");

const simpleAction = simpleActionCreater(); // expect: {type: "SIMPLE_ACTION"}

actions.push(simpleAction);

// if you need the type-string:
const SIMPLE_ACTION = simpleAction.type;

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