import { declareActionCreater, createReducer, ActionCreater, Action } from "../../src";

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

