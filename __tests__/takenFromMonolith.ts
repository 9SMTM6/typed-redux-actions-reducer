import { OnError, OnSuccess, ActionCreatorObject, createReducer } from '../src/reducer'
import { ActionData, Action, ActionCreator, declareActionCreater, ExtractActionLoad } from '../src/actionCreater'
import { WithTYPE, mapKeysToTYPE } from '../src/typedDictionary'
// --------------------- test

type TestDataBoth = ActionData<{ pa: number }, { msg: string }>; // expect {payload: Payload} | {error: extends ActionError}, 

type TestDataNoPayload = ActionData<false, { msg: string, addInfo: string }>; // expect {payload: Payload} | {error?: extends ActionError}, 

type TestDataNoError = ActionData<{ param: string }, false>; // expect {payload: Payload}

type TestDataNothing = ActionData<false, false>; // expect undefined

// ---------------------- new code

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

// -------------------------------- tests

type genLoad = ExtractActionLoad<typeof withBoth>;

// ------------------------------ new code

// ------------------ tests

type SomeReaction = OnSuccess<typeof withBoth, { some: number, other: string }>;

type SomeErrorReaction = OnError<typeof withBoth, { some: number, other: string }>;

const someErrorReaction: SomeErrorReaction = (state, error) => {
    return {
        ...state,
        other: JSON.stringify(error),
    };
};

const someReaction: SomeReaction = (state, payload) => {
    return {
        ...state,
        ...payload,
    };
};

// ---------------------- new code

// -------------------------------- tests

const lala: ActionCreatorObject = {
    withBoth,
    withPayload
}

const redeclared = lala.withBoth;

// ------------------------------ new code

// -------------------------------- tests

const laerba = { TYPE: 'TEST' as 'TEST' };

type srbve = typeof laerba extends WithTYPE<infer TYPE> ? TYPE : unknown;

// ------------------------------ new code

// -------------------------------- tests

const cre = mapKeysToTYPE({ withPayload, withErrorhandling });

cre.WITH_ERRORHANDLING

// ------------------------------ new code


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
