"use strict";
// Built with Typescript 3.3.X and Redux 3.7.X.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var testActionBothError = { type: 'LALA', error: { msg: 'This is an test Error' } };
// doesnt throw an error if additional parameters are given!
var testActionBoth = { type: 'LALA', payload: { pa: 4, some: 'la' } };
// note that IDE offers autocomplete but we loose type-information here because of the phenomena described in the definition of Action
// because of that the IDE offers no autocomplete.
var testActionNoPayloadError = { type: 'LALA', error: { msg: 'This works now.', addInfo: 'addString' } };
var testActionNoPayload = { type: 'LALA' };
var testActionNoError = { type: 'LALA', payload: { param: 's' } };
var testActionNothing = { type: 'LALA' };
var som = function (data) {
    return __assign({ type: 'LALA' }, data);
};
som.TYPE = 'LALA';
// @ts-ignore Just to test for autocomplete, works without TYPE attribute, with it theres no way to make this work properly.
var testCreatorNoError = function (data) {
    return __assign({ type: 'LALA' }, data);
};
// @ts-ignore
var testCreatorNoPayload = function (data) {
    return __assign({ type: 'LALA' }, data);
};
// @ts-ignore
var testCreatorBoth = function (data) {
    return __assign({ type: 'LALA' }, data);
};
var createdAction = testCreatorBoth({ error: { msg: 'this is also an error' } });
/**
 * Usage:
 * @param TYPE The string thats matched in the Reducer
 * @param PAYLOADSAMPLE Due to limitations of Typescript this is needed to extract the type of the payload (action.data),
 * which is needed for mapped types later.
 * Also enables usage of the "Type" of the actionCreater at runtime in the Reducers
 *
 * Use with:
 *
 * `{} as PAYLOADTYPE`
 *
 * or `false` if you dont want to give a payload or handle errors.
 *
 * Beside that it also makes sense as the `TYPE` Field really is sort of a Type too,
 * the whole declaration of an action is really just one big type declaration if you think about it.
 */
exports.declareActionCreater = function (TYPE, PAYLOADSAMPLE, ERRORSAMPLE) {
    [PAYLOADSAMPLE, ERRORSAMPLE].forEach(function (SAMPLE) {
        if (SAMPLE && (0 !== Object.keys(PAYLOADSAMPLE).length)) {
            // tslint:disable no-console max-line-length
            console.error('Error while creating an action: Unintended use of the SAMPLE parameter, potentially generating an unintended Types');
        }
    });
    // @todo Test for performance improvement if we skip the cases payload and error if they were given as false
    // @ts-ignore
    var actionCreater = function (data) {
        if (!data) {
            return {
                type: TYPE,
            };
        }
        if ('payload' in data && data.payload) {
            return {
                type: TYPE,
                payload: data.payload,
            };
        }
        if ('error' in data && data.error) {
            return {
                type: TYPE,
                error: data.error,
            };
        }
        return {
            error: { msg: 'Unknown error during creation of ' + TYPE }
        };
    };
    actionCreater.TYPE = TYPE;
    return actionCreater;
};
// -------------------------------------- tests
var onlyMessage = exports.declareActionCreater('ONLY_MESSAGE', false, false);
var withPayload = exports.declareActionCreater('WITH_PAYLOAD', {}, false);
var withErrorhandling = exports.declareActionCreater('WITH_ERRORHANDLING', false, {});
var withBoth = exports.declareActionCreater('WITH_PAYLOAD_OR_ERROR', {}, {});
var onlyMessageAction = onlyMessage();
var simpleNoError = withErrorhandling();
var simpleError = withErrorhandling({ error: { msg: 'This is an error' } });
var payloadAction = withPayload({ payload: { somedata: 'lala' } });
var bothNoError = withBoth({ payload: { otherload: { num: 6 } } });
var bothError = withBoth({ error: { msg: 'This is also an Error' } });
var someErrorReaction = function (state, error) {
    return __assign({}, state, { other: error.msg });
};
var someReaction = function (state, payload) {
    return __assign({}, state, payload);
};
// -------------------------------- tests
var lala = {
    withBoth: withBoth,
    withPayload: withPayload
};
var redeclared = lala.withBoth;
// -------------------------------- tests
var laerba = { TYPE: 'TEST' };
exports.mapKeysToTYPE = function (originalObj) {
    var reMappedObj = {};
    for (var key in originalObj) {
        var element = originalObj[key];
        reMappedObj[element.TYPE] = element;
    }
    // @ts-ignore I know what I'm returning and what not.
    return reMappedObj;
};
// -------------------------------- tests
var cre = exports.mapKeysToTYPE({ withPayload: withPayload, withErrorhandling: withErrorhandling });
cre.WITH_ERRORHANDLING;
// ------------------------------ new code
exports.createReducer = function (initialState, handleActions) {
    return function (reactions) {
        // tslint: disable-next-line no-any We need to enable all kinds of actions here.
        // this any here also disables type testing later on, but we already assured the right type (more or less)
        return function (state, action) {
            if (state === void 0) { state = initialState; }
            var fittingReaction = reactions[action.type]; // this is the 'switch-case'
            if (!fittingReaction) { // this is the 'default' case
                return state;
            }
            if (('error' in action && action.error)) { // this is ecexuting the right reaction and merging it with the state
                if ('onError' in fittingReaction) {
                    return __assign({}, state, fittingReaction.onError(state, action.error));
                }
                else {
                    console.error('Unhandled error occured while handling the Action ' + action.type);
                    return state;
                }
            }
            if ('payload' in action && action.payload) {
                return __assign({}, state, fittingReaction.onSuccess(state, action.payload));
            }
        };
    };
};
// -------------------------------- tests
var exampleInit = {
    flag: false,
    text: 'Initial filling'
};
var reducer = exports.createReducer(exampleInit, { withPayload: withPayload, withErrorhandling: withErrorhandling, withBoth: withBoth, onlyMessage: onlyMessage })({
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
// console.log('before', exampleState);
// exampleState = reducer(exampleState, withBoth({ payload: { otherload: { num: 5 } } }));
// console.log('after fitting', exampleState);
// exampleState = reducer(exampleState, { type: 'OTHER_ACTION', error: { msg: 'Shouldnt do a thing' } });
// console.log('after unfitting', exampleState);
// exampleState = reducer(exampleState, withBoth({ error: { msg: 'does this work?' } }));
// console.log('after error', exampleState);
// exampleState = reducer(exampleState, { type: 'WITH_PAYLOAD', error: { msg: 'does this work?' } });
// console.log('after error 2', exampleState);
