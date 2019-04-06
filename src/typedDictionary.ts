
export type WithTYPE<TYPE extends string> = { TYPE: TYPE };

type WithTYPEObj = { [Key: string]: WithTYPE<string> }

type NeverfyKeysWithoutRightTYPE<BaseObj, TYPE extends string> = { [Key in keyof BaseObj]: BaseObj[Key] extends WithTYPE<TYPE> ? Key : never };

type GetKeyForTYPE<BaseObj, TYPE extends string> = NeverfyKeysWithoutRightTYPE<BaseObj, TYPE>[keyof BaseObj];

export type TYPEDictionary<Obj extends WithTYPEObj> = {
    [TYPE in Obj[keyof Obj]['TYPE']]: Obj[GetKeyForTYPE<Obj, TYPE>]
};

export const mapKeysToTYPE = <Obj extends WithTYPEObj>(originalObj: Obj): TYPEDictionary<Obj> => {
    let reMappedObj = {};
    for (const key in originalObj) {
        const element = originalObj[key];
        reMappedObj[element.TYPE] = element;
    }
    // @ts-ignore I know what I'm returning and what not.
    return reMappedObj;
}

