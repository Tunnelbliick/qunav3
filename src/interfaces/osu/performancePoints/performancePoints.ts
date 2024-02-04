import { ObjectId } from "mongoose";
import { pp } from "./pp";

export interface PerformancePoints {
    id: ObjectId,
    mapid: string,
    checksum: string,
    mode: string,
    mods: Array<Object>,
    pp: pp,
    difficulty: Object,
    graph: Object
}