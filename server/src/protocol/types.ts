export enum RESPType {
  SimpleString = "+",
  Error = "-",
  Integer = ":",
  BulkString = "$",
  Array = "*",
  Null = "_\n",
}

export type RESPValue =
  | { type: RESPType.SimpleString; value: string }
  | { type: RESPType.Error; value: string }
  | { type: RESPType.Integer; value: number }
  | { type: RESPType.BulkString; value: string | null }
  | { type: RESPType.Array; value: RESPValue[] | null }
  | { type: RESPType.Null; value: null };

export interface CommandMessage {
  name: string;
  args: string[];
  raw: RESPValue;
}
