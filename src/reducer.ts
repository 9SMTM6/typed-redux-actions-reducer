import { TYPEDictionary } from "./typedDictionary";
import { ActionCreater, Action, ActionData } from "./actionCreater";

// Built with Typescript 3.3.X and Redux 3.7.X.

// tslint:disable no-any 
export type OnSuccess<
    Creator extends (...params: unknown[]) => unknown,
    State extends object
    > = Creator extends ActionCreater<infer TYPE, infer Payload, infer Error> ?
    Payload extends false ?
    (state: State) => Partial<State> :
    (state: State, payload: Payload) => Partial<State> : never;

export type OnError<
    Creator extends (...params: unknown[]) => unknown,
    State extends object
    > = Creator extends ActionCreater<infer TYPE, infer Payload, infer Error> ?
    Error extends false ?
    (state: State) => Partial<State> :
    (state: State, error: Error) => Partial<State> : never;

type ReactionsRecord<TYPE extends string, Payload extends (false | object), Error extends (false | object), State extends object> = {
    onSuccess: OnSuccess<ActionCreater<TYPE, Payload, Error>, State>;
    onError?: OnError<ActionCreater<TYPE, Payload, Error>, State>;
}

type NormReaction<TYPE extends string, Payload extends (false | object), Error extends (false | object), State extends object> = (
    state: State,
    action: Action<TYPE, ActionData<Payload, Error>>,
) => State

type ReactionNormer<TYPE extends string, Payload extends (false | object), Error extends (false | object), State extends object> = (
    reactions: ReactionsRecord<TYPE, Payload, Error, State>
) => NormReaction<string, false | object, false | object, State>;

export type ActionCreatorObject = { [Key: string]: ActionCreater<string, false | object, false | object> }

type ReactionsObject = { [Key: string]: ReactionNormer<string, false | object, false | object, object> }

export const createReducer = <State extends object, Creators extends ActionCreatorObject>(initialState: State, handleActions: Creators) => {
    type ActionsByTYPE = TYPEDictionary<Creators>;

    type AllReactionsRecord = { [TYPE in keyof ActionsByTYPE]:
        ActionsByTYPE[TYPE] extends ActionCreater<
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
            // this is executing the right reaction and merging it with the state
            if (('error' in action)) {
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
                // Javascript will just ignore an additional parameter if its not defined on the function,
                // so this is legal wheter a payload is defined or this is just a simple action.
                ...fittingReaction.onSuccess(state, action['payload']),
            };
        };
    };
};
