import { declareActionCreater} from "../src";

export const simple = declareActionCreater("SIMPLE_ACTION");

export const payload = declareActionCreater("PAYLOAD_ACTION", {} as { data: string });

export const error = declareActionCreater("ERROR_ACTION", false, {} as { errordata: string });

export const payloadOrError = declareActionCreater("PAYLOAD_ERROR_ACTION", {} as { data: string }, {} as { errordata: string });
