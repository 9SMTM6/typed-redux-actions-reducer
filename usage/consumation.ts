import * as actionCreators from "./actionCreaters";

/*
Of course you'd usually dispatch them instead of export them.
*/

export const simpleAction = actionCreators.simple(); // expect: {type: "SIMPLE_ACTION"}

export const payloadAction = actionCreators.payload({ payload: { data: "instance" } }); // expect: {type: "PAYLOAD_ACTION", payload: { data: "instance" } }

export const errorAction1 = actionCreators.error(); // expect: {type: "ERROR_ACTION"}

export const errorAction2 = actionCreators.error({ error: { errordata: "instance" } }); // expect: {type: "ERROR_ACTION", error: { errordata: "instance" } }

export const payloadOrErrorAction1 = actionCreators.payloadOrError({ payload: { data: "instance" } }); // expect: {type: "PAYLOAD_ERROR_ACTION", payload: { data: "instance" } }

export const payloadOrErrorAction2 = actionCreators.payloadOrError({ error: { errordata: "instance" } }); // expect: {type: "PAYLOAD_ERROR_ACTION", error: { errordata: "instance" } }
