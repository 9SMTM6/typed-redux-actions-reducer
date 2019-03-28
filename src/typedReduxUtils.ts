// Built with Typescript 3.3.X and Redux 3.7.X.

// tslint:disable no-any 

type ActionBloat<TYPE extends string = string> = { type: TYPE };

type ActionData<
    Payload extends (object | false),
    Error extends (object | false),
    > = Payload extends false ? Error extends false ?
    {} : // no payload, no error (would prefer never but that would result in union types being resoved to never.)
    { error?: Error } : // error, no payload
    Error extends false ?
    { payload: Payload } : // no error, payload
    { payload: Payload } | { error: Error }; // payload or error

// --------------------- test

type TestDataBoth = ActionData<{ pa: number }, { msg: string }>; // expect {payload: Payload} | {error: extends ActionError}, 

type TestDataNoPayload = ActionData<false, { msg: string, addInfo: string }>; // expect {payload: Payload} | {error?: extends ActionError}, 

type TestDataNoError = ActionData<{ param: string }, false>; // expect {payload: Payload}

type TestDataNothing = ActionData<false, false>; // expect undefined

// ---------------------- new code

export type Action<
    TYPE extends string,
    Data extends ActionData<false | object, false | object>,
    > = ActionBloat<TYPE> & (Data extends ActionData<infer Payload, infer Error> ? ActionData<Payload, Error> :
        Data extends {} ? ActionData<false, any> : unknown); // unknown);
/* Above line is handling an error in Typescript
When no payload is defined a Action can be undefined (i.e. just the message). In this case Typescript seems unable to 
figure out that this 'undefined' can indeed be an extention of ActionData, and thus is choosing the last option, unknown.

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
    Error extends false | object,
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
 * Overload for the case of declared or undeclared payload-type and error type.
 */
type DeclareActionCreator = {
    <
        TYPE extends string,
        Payload extends (object | false),
        Error extends (object | false),
        >(
        TYPE: TYPE,
        SAMPLEDATA: Payload,
        SAMPLEERROR: Error,
    ): ActionCreator<TYPE, Payload, Error>;
    <
        TYPE extends string,
        Payload extends (object | false),
        >(
        TYPE: TYPE,
        SAMPLEDATA: Payload,
    ): ActionCreator<TYPE, Payload, false>;
    <
        TYPE extends string,
        >(
        TYPE: TYPE,
    ): ActionCreator<TYPE, false, false>;
}

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
export const declareActionCreater: DeclareActionCreator = (TYPE, PAYLOADSAMPLE = false, ERRORSAMPLE = false) => {
    [PAYLOADSAMPLE, ERRORSAMPLE].forEach((SAMPLE) => {
        if (SAMPLE && (0 !== Object.keys(SAMPLE as unknown as object).length)) {
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
            type: TYPE,
        };
    };
    actionCreater.TYPE = TYPE;
    return actionCreater;
};

/**
 * PLACEHOLDER
 * 
 * wondering if we can get type-testing for the connected store and the reducer.
 * could alternatively create an connected reducer?
 * 
 * @returns either a wrapped declareActionCreator OR an object having this as named parameter 'connectedActionCreater'.
 * Reason: Dont have people accidentially importing the unconnected declareActionCreator from here (IDE) if they call it the same.
 * The object would be a small nudge in the 'different name' direction
 */
export const declareConnectedActionCreater = (dispatch?: any, store?: any) => {
}

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
    > = Creator extends ActionCreator<string, infer Payload, infer Error> ? 
    Payload extends false ?
    (state: State) => Partial<State> : 
    (state: State, payload: Payload) => Partial<State>: never;

type OnError<
    Creator extends (...params: unknown[]) => unknown,
    State extends object
    > = Creator extends ActionCreator<string, infer Payload, infer Error> ? 
    Error extends false ? 
    (state: State) => Partial<State> :
    (state: State, error: Error) => Partial<State> : never;

type ReactionsRecord<TYPE extends string, Payload extends (false | object), Error extends (false | object), State extends object> = {
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

type NormReaction<TYPE extends string, Payload extends (false | object), Error extends (false | object), State extends object> = (
    state: State,
    action: Action<TYPE, ActionData<Payload, Error>>,
) => State

type ReactionNormer<TYPE extends string, Payload extends (false | object), Error extends (false | object), State extends object> = (
    reactions: ReactionsRecord<TYPE, Payload, Error, State>
) => NormReaction<string, false | object, false | object, State>;

type ActionCreatorObject = { [Key: string]: ActionCreator<string, false | object, false | object> }

type ReactionsObject = { [Key: string]: ReactionNormer<string, false | object, false | object, object> }

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
        return (state: State | undefined = { ...initialState }, action: Action<string, ActionData<object | false, object | false>>): State => {
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
            return {
                ...state,
                ...fittingReaction.onSuccess(state, action['payload']),
            };
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
        onSuccess: (state) => {
            return {};
        },
    },
    WITH_PAYLOAD: {
        onSuccess: (state, payload) => {
            return state;
        }
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

let exampleState = reducer(undefined, { type: 'INIT' });

// @todo tests auslagern und formalisieren, außerdem wurden folgende fehler nicht früher bemerkt: Verhalten bei aktion ohne payload im reducer (ohne payload wird ignoriert) und im actioncreator (typ war nicht gesetz, error paramerer wurde auch mit gegeben.)

// console.log('before', exampleState);
// exampleState = reducer(exampleState, withBoth({ payload: { otherload: { num: 5 } } }));
// console.log('after fitting', exampleState);
// exampleState = reducer(exampleState, { type: 'OTHER_ACTION', error: { msg: 'Shouldnt do a thing' } });
// console.log('after unfitting', exampleState);
// exampleState = reducer(exampleState, withBoth({ error: { msg: 'does this work?' } }));
// console.log('after error', exampleState);
// exampleState = reducer(exampleState, { type: 'WITH_PAYLOAD', error: { msg: 'does this work?' } });
// console.log('after error 2', exampleState);
