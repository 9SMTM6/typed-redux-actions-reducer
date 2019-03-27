"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typedReduxUtils_1 = require("./typedReduxUtils");
var newActionCreater = typedReduxUtils_1.declareActionCreater('NEW_ACTION', {}, false);
var action = newActionCreater({ payload: {
        param1: true,
        param2: {
            fdghser: '5'
        }
    } });
var onlyMessage = typedReduxUtils_1.declareActionCreater('ONLY_MESSAGE', false, false);
var withPayload = typedReduxUtils_1.declareActionCreater('WITH_PAYLOAD', {}, false);
var withErrorhandling = typedReduxUtils_1.declareActionCreater('WITH_ERRORHANDLING', false, {});
var withBoth = typedReduxUtils_1.declareActionCreater('WITH_PAYLOAD_OR_ERROR', {}, {});
var exampleInit = {
    flag: false,
    text: 'Initial filling'
};
var reducer = typedReduxUtils_1.createReducer(exampleInit, { withPayload: withPayload, withErrorhandling: withErrorhandling, withBoth: withBoth, onlyMessage: onlyMessage })({
    WITH_ERRORHANDLING: {
        onSuccess: function (state, payload) {
            return {};
        },
    },
    WITH_PAYLOAD: {
        onSuccess: function (state) {
            return state;
        }
    },
    ONLY_MESSAGE: {
        onSuccess: function (state, payload) {
            return {};
        }
    },
    WITH_PAYLOAD_OR_ERROR: {
        onSuccess: function (state, payload) {
            return {
                text: String(payload.otherload.num + 2)
            };
        },
        onError: function (state, error) {
            console.log('encountered error');
            return {
                text: 'now Reset with ' + error.msg
            };
        }
    }
});
var exampleState = reducer(undefined, { type: 'INIT' });
console.log('before', exampleState);
exampleState = reducer(exampleState, withBoth({ payload: { otherload: { num: 5 } } }));
console.log('after fitting', exampleState);
exampleState = reducer(exampleState, { type: 'OTHER_ACTION', error: { msg: 'Shouldnt do a thing' } });
console.log('after unfitting', exampleState);
exampleState = reducer(exampleState, withBoth({ error: { msg: 'does this work?' } }));
console.log('after error', exampleState);
exampleState = reducer(exampleState, { type: 'WITH_PAYLOAD', error: { msg: 'does this work?' } });
console.log('after error 2', exampleState);
