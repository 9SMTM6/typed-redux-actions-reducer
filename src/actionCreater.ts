
type ActionBloat<TYPE extends string = string> = { type: TYPE };

export type ActionData<
    Payload extends (object | false),
    Error extends (object | false),
    > = Payload extends false ? Error extends false ?
    {} : // no payload, no error (would prefer never but that would result in union types being resoved to never.)
    { error?: Error } : // error, no payload
    Error extends false ?
    { payload: Payload } : // no error, payload
    { payload: Payload } | { error: Error }; // payload or error


export type Action<
    TYPE extends string,
    Data extends ActionData<false | object, false | object>,
    > = ActionBloat<TYPE> & (Data extends ActionData<infer Payload, infer Error> ? ActionData<Payload, Error> :
        Data extends {} ? ActionData<false, any> : unknown); // unknown);
/* 
Above line is handling an error in Typescript
When no payload is defined a Action can be undefined (i.e. just the message). In this case Typescript seems unable to 
figure out that this 'undefined' can indeed be an extention of ActionData, and thus is choosing the last option, unknown.

Other option: Enforce that theres always an "data"-Object.
*/

/*
ISNT WORKING. Issue: Seems Typecsript doesnt like nested infers.
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
export type ActionCreater<
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

/**
 * Overload for the case of declared or undeclared payload-type and error type.
 */
type DeclareActionCreater = {
    <
        TYPE extends string,
        Payload extends (object | false),
        Error extends (object | false),
        >(
        TYPE: TYPE,
        SAMPLEDATA: Payload,
        SAMPLEERROR: Error,
    ): ActionCreater<TYPE, Payload, Error>;
    <
        TYPE extends string,
        Payload extends (object | false),
        >(
        TYPE: TYPE,
        SAMPLEDATA: Payload,
    ): ActionCreater<TYPE, Payload, false>;
    <
        TYPE extends string,
        >(
        TYPE: TYPE,
    ): ActionCreater<TYPE, false, false>;
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
export const declareActionCreater: DeclareActionCreater = (TYPE, PAYLOADSAMPLE = false, ERRORSAMPLE = false) => {
    [PAYLOADSAMPLE, ERRORSAMPLE].forEach((SAMPLE) => {
        if (SAMPLE && (0 !== Object.keys(SAMPLE as unknown as object).length)) {
            // tslint:disable no-console max-line-length
            console.error('Error while creating an action: Unintended use of the SAMPLE parameter, potentially generating an unintended Types');
        }
    });
    // @todo Test for performance improvement if we skip the cases payload and error if they were given as false
    // @ts-ignore
    const actionCreater: ActionCreater<typeof TYPE, typeof PAYLOADSAMPLE, typeof ERRORSAMPLE> = (data) => {
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

export type ExtractActionLoad<T extends (...params: unknown[]) => unknown> = T extends ActionCreater<string, infer Payload, infer Error> ? ActionData<Payload, Error> : never;

