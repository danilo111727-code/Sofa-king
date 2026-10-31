export function encodeBackup(payload: any): {buffer: Buffer;checksum:string};
export function prepareRelease(client: any,schemaSql:string,backupFile?:string): Promise<{id:string;checksum:string;counts:Record<string,number>}>;
