// Built with Typescript 3.3.X and Redux 3.7.X.

// tslint:disable no-any 

type ActionBloat<TYPE extends string = string> = { type: TYPE };

type ActionError = { msg: string };

type ActionData<
    Payload extends (object | false),
    Error extends (ActionError | false),
    > = Payload extends object ?
    (Error extends ActionError ? ({ payload: Payload } | { error: Error }) : // case both error and payload are defined
        { payload: Payload }) : // case payload is defined but no error handling
    Error extends ActionError ? ({ error?: Error }) // case no payload but error handling is covered
    : {}; // case no error handling or payload, so never any data.

// cant use never at the end because: 
type resolvesToNever = { some: string, data: boolean } & never;

// --------------------- test

type TestDataBoth = ActionData<{ pa: number }, { msg: string }>; // expect {payload: Payload} | {error: extends ActionError}, 
// throws error on no msg in error

type TestDataNoPayload = ActionData<false, { msg: string, addInfo: string }>; // expect {payload: Payload} | {error?: extends ActionError}, 
// throws error on no msg in error

type TestDataNoError = ActionData<{ param: string }, false>; // expect {payload: Payload}

type TestDataNothing = ActionData<false, false>; // expect undefined

// ---------------------- new code

export type Action<
    TYPE extends string,
    Data extends ActionData<false | object, false | ActionError>,
    > = ActionBloat<TYPE> & (Data extends ActionData<infer Payload, infer Error> ? Data :
        ActionData<false, { msg: string }>); // unknown);
/* Above line is handling an error in Typescript
When no payload is defined a Action can be undefined (i.e. just the message). In this case Typescript seems unable to 
figure out that this 'undefined' can indeed be an extention of ActionData, and thus is choosing the last option, unknown.

This is causing the following issues right now: Typescript is loosing type Information and presumably savety. 
Though the unknown following the line should theoretically never occur.

Other option: Enforce that theres always an "data"-Object.
 */

// --------------------- test

type TestActionBoth = Action<'LALA', TestDataBoth>;

type TestActionNoPayload = Action<'LALA', TestDataNoPayload>;

type TestActionNoError = Action<'LALA', TestDataNoError>;

type TestActionNothing = Action<'LALA', TestDataNothing>;


const testActionBothError: TestActionBoth = { type: 'LALA', error: { msg: 'This is an test Error' } };

// doesnt throw an error if additional parameters are given!
const testActionBoth: TestActionBoth = { type: 'LALA', payload: { pa: 4, some: 'la' } };

// note that IDE offers autocomplete but we loose type-information here because of the phenomena described in the definition of Action
// because of that the IDE offers no autocomplete.
const testActionNoPayloadError: TestActionNoPayload = { type: 'LALA', error: { msg: 'This works now.', addInfo: 'addString' } };

const testActionNoPayload: TestActionNoPayload = { type: 'LALA' };

const testActionNoError: TestActionNoError = { type: 'LALA', payload: { param: 's' } };

const testActionNothing: TestActionNothing = { type: 'LALA' };

// ---------------------- new code

/* ISNT WORKING. Issue: Seems Typecsript doesnt like nested infers.
Seems to work at first (like when testing with {}) but then fails on real tests or when branching further with conditional types
*/
// type ActionCreator<Target extends Action<string, ActionData<false | object, false | ActionError>>> = Target extends Action<
//     infer TYPE,
//     infer Data> ? Data extends ActionData<infer Payload, infer Error> ?
//     // (data: Data) => unknown : unknown : unknown; // for testing

// So we need to explicitly give types

/** 
 * An overload for the case of normal usage and error-case.
 * 
 * Additionally adds the TYPE attribute on the function.
 * Something like that is typically JavaScript and enables use of my inhouse Reducers.
 * Needs Typescript >=3.1.
 */
export type ActionCreator<
    TYPE extends string,
    Payload extends false | object,
    Error extends false | ActionError,
    > = (Payload extends false ? { // make parameter optional in case theres no payload 
        // (could be error thus we still need it)
        (data?: ActionData<Payload, Error>): Action<TYPE, ActionData<Payload, Error>>
    } : {
        (data: ActionData<Payload, Error>): Action<TYPE, ActionData<Payload, Error>>
    }) & {
        TYPE: TYPE
    };

// --------------------- test

type TestCreatorBoth = ActionCreator<'LALA', { pa: number }, { msg: string }>;

type TestCreatorNoPayload = ActionCreator<'LALA', false, { msg: string, addInfo: string }>;

type TestCreatorNoError = ActionCreator<'LALA', { param: string }, false>;

type TestCreatorNothing = ActionCreator<'LALA', false, false>;

const som = (data: TestDataNoError) => {
    return {
        type: 'LALA' as 'LALA',
        ...data
    };
};

som.TYPE = 'LALA' as 'LALA';

// @ts-ignore Just to test for autocomplete, works without TYPE attribute, with it theres no way to make this work properly.
const testCreatorNoError: TestCreatorNoError = (data) => {
    return {
        type: 'LALA' as 'LALA',
        ...data,
    };
};
// @ts-ignore
const testCreatorNoPayload: TestCreatorNoPayload = (data) => {
    return {
        type: 'LALA' as 'LALA',
        ...data,
    };
};
// @ts-ignore
const testCreatorBoth: TestCreatorBoth = (data) => {
    return {
        type: 'LALA' as 'LALA',
        ...data,
    };
};

const createdAction = testCreatorBoth({ error: { msg: 'this is also an error' } });

// ---------------------- new code

/** 
 * Forces people to give arguments for `SAMPLEDATA` and `SAMPLEERROR`.
 * 
 * This makes for a far easier implementation in Typescript and forces people to think abou
 * if they really dont want to handle errors etc.
 */
type DeclareActionCreator = <
    TYPE extends string,
    Payload extends (object | false),
    Error extends (ActionError | false),
    >(
    TYPE: TYPE,
    SAMPLEDATA: Payload,
    SAMPLEERROR: Error,
) => ActionCreator<TYPE, Payload, Error>;

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
export const declareActionCreater: DeclareActionCreator = (TYPE, PAYLOADSAMPLE, ERRORSAMPLE) => {
    [PAYLOADSAMPLE, ERRORSAMPLE].forEach((SAMPLE) => {
        if (SAMPLE && (0 !== Object.keys(PAYLOADSAMPLE as object).length)) {
            // tslint:disable no-console max-line-length
            console.error('Error while creating an action: Unintended use of the SAMPLE parameter, potentially generating an unintended Types');
        }
    });
    // @todo Test for performance improvement if we skip the cases payload and error if they were given as false
    // @ts-ignore
    const actionCreater: ActionCreator<typeof TYPE, typeof PAYLOADSAMPLE, typeof ERRORSAMPLE> = (data) => {
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

const onlyMessage = declareActionCreater('ONLY_MESSAGE', false, false);

const withPayload = declareActionCreater(
    'WITH_PAYLOAD', {} as {
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

const onlyMessageAction = onlyMessage();

const simpleNoError = withErrorhandling();

const simpleError = withErrorhandling({ error: { msg: 'This is an error' } });

const payloadAction = withPayload({ payload: { somedata: 'lala' } });

const bothNoError = withBoth({ payload: { otherload: { num: 6 } } });

const bothError = withBoth({ error: { msg: 'This is also an Error' } });

// console.log(onlyMessageAction, simpleNoError, simpleError, payloadAction, bothNoError, bothError);

// ------------------------------ new code

export type ExtractActionLoad<T extends (...params: unknown[]) => unknown> = T extends ActionCreator<string, infer Payload, infer Error> ? ActionData<Payload, Error> : never;

// -------------------------------- tests

type genLoad = ExtractActionLoad<typeof withBoth>;

// ------------------------------ new code

type OnSuccess<
    Creator extends (...params: unknown[]) => unknown,
    State extends object
    > = Creator extends ActionCreator<string, infer Payload, infer Error> ? (
        state: State,
        payload: Payload
    ) => Partial<State> : never;

type OnError<
    Creator extends (...params: unknown[]) => unknown,
    State extends object
    > = Creator extends ActionCreator<string, infer Payload, infer Error> ? (
        state: State,
        error: Error
    ) => Partial<State> : never;

type ReactionsRecord<TYPE extends string, Payload extends (false | object), Error extends (false | ActionError), State extends object> = {
    onSuccess: OnSuccess<ActionCreator<TYPE, Payload, Error>, State>;
    onError?: OnError<ActionCreator<TYPE, Payload, Error>, State>;
}

// ------------------ tests

type SomeReaction = OnSuccess<typeof withBoth, { some: number, other: string }>;

type SomeErrorReaction = OnError<typeof withBoth, { some: number, other: string }>;

const someErrorReaction: SomeErrorReaction = (state, error) => {
    return {
        ...state,
        other: error.msg,
    };
};

const someReaction: SomeReaction = (state, payload) => {
    return {
        ...state,
        ...payload,
    };
};

// ---------------------- new code

type NormReaction<TYPE extends string, Payload extends (false | object), Error extends (false | ActionError), State extends object> = (
    state: State,
    action: Action<TYPE, ActionData<Payload, Error>>,
) => State

type ReactionNormer<TYPE extends string, Payload extends (false | object), Error extends (false | ActionError), State extends object> = (
    reactions: ReactionsRecord<TYPE, Payload, Error, State>
) => NormReaction<string, false | object, false | ActionError, State>;

type ActionCreatorObject = { [Key: string]: ActionCreator<string, false | object, false | ActionError> }

type ReactionsObject = { [Key: string]: ReactionNormer<string, false | object, false | ActionError, object> }

// -------------------------------- tests

const lala: ActionCreatorObject = {
    withBoth,
    withPayload
}

const redeclared = lala.withBoth;

// ------------------------------ new code

type WithTYPE<TYPE extends string> = { TYPE: TYPE };

type WithTYPEObj = { [Key: string]: WithTYPE<string> }

// -------------------------------- tests

const laerba = { TYPE: 'TEST' as 'TEST' };

type srbve = typeof laerba extends WithTYPE<infer TYPE> ? TYPE : unknown;

// ------------------------------ new code

type NeverfyKeysWithoutRightTYPE<BaseObj, TYPE extends string> = { [Key in keyof BaseObj]: BaseObj[Key] extends WithTYPE<TYPE> ? Key : never };

type GetKeyForTYPE<BaseObj, TYPE extends string> = NeverfyKeysWithoutRightTYPE<BaseObj, TYPE>[keyof BaseObj];

export const mapKeysToTYPE = <Obj extends WithTYPEObj>(originalObj: Obj): {
    [TYPE in Obj[keyof Obj]['TYPE']]: Obj[GetKeyForTYPE<Obj, TYPE>]
} => {
    let reMappedObj = {};
    for (const key in originalObj) {
        const element = originalObj[key];
        reMappedObj[element.TYPE] = element;
    }
    // @ts-ignore I know what I'm returning and what not.
    return reMappedObj;
}

export type TYPEDictionary<Obj extends WithTYPEObj> = {
    [TYPE in Obj[keyof Obj]['TYPE']]: Obj[GetKeyForTYPE<Obj, TYPE>]
};

// -------------------------------- tests

const cre = mapKeysToTYPE({ withPayload, withErrorhandling });

cre.WITH_ERRORHANDLING

// ------------------------------ new code

export const createReducer = <State extends object, Creators extends ActionCreatorObject>(initialState: State, handleActions: Creators) => {
    type ActionsByTYPE = TYPEDictionary<Creators>;

    type AllReactionsRecord = { [TYPE in keyof ActionsByTYPE]:
        ActionsByTYPE[TYPE] extends ActionCreator<
            infer _TYPE,
            infer Payload,
            infer Error
        > ? ReactionsRecord<TYPE, Payload, Error, State> : unknown;
    };
    return (reactions: AllReactionsRecord) => {
        // tslint: disable-next-line no-any We need to enable all kinds of actions here.
        // this any here also disables type testing later on, but we already assured the right type (more or less)
        return (state: State | undefined = initialState, action: Action<string, ActionData<object | false, ActionError | false>>): State => {
            const fittingReaction = reactions[action.type] as (ReactionsRecord<any, any, any, State> | undefined); // this is the 'switch-case'
            if (!fittingReaction) { // this is the 'default' case
                return state;
            }
            if (('error' in action && action.error)) { // this is ecexuting the right reaction and merging it with the state
                if ('onError' in fittingReaction) {
                    return {
                        ...state,
                        // @ts-ignore
                        ...fittingReaction.onError(state, action.error),
                    };
                } else {
                    console.error('Unhandled error occured while handling the Action ' + action.type);
                    return state;
                }
            }
            if ('payload' in action && action.payload) {
                return {
                    ...state,
                    ...fittingReaction.onSuccess(state, action.payload),
                };
            }
            return state;
        };
    };
};

// -------------------------------- tests

let exampleInit = {
    flag: false,
    text: 'Initial filling'
};

const reducer = createReducer(exampleInit, { withPayload, withErrorhandling, withBoth, onlyMessage })({
    WITH_ERRORHANDLING: {
        onSuccess: (state, payload) => {
            return {};
        },
    },
    WITH_PAYLOAD: {
        onSuccess: (state) => {
            return state;
        }
    },
    ONLY_MESSAGE: {
        onSuccess: (state, payload) => {
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

let exampleState = reducer(undefined, {type: 'INIT'});

// console.log('before', exampleState);
// exampleState = reducer(exampleState, withBoth({ payload: { otherload: { num: 5 } } }));
// console.log('after fitting', exampleState);
// exampleState = reducer(exampleState, { type: 'OTHER_ACTION', error: { msg: 'Shouldnt do a thing' } });
// console.log('after unfitting', exampleState);
// exampleState = reducer(exampleState, withBoth({ error: { msg: 'does this work?' } }));
// console.log('after error', exampleState);
// exampleState = reducer(exampleState, { type: 'WITH_PAYLOAD', error: { msg: 'does this work?' } });
// console.log('after error 2', exampleState);