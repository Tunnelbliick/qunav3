export enum Gamemode {
    OSU = "osu", 
    MANIA = "mania", 
    FRUITS = "fruits", 
    TAIKO = "taiko"
}

export function modeIdToEnum(mode_id: number) {
    switch(mode_id) {
        case 0:
            return Gamemode.OSU;
        case 1:
            return Gamemode.TAIKO;
        case 2:
            return Gamemode.FRUITS;
        case 3:
            return Gamemode.MANIA;
        default:
            return Gamemode.OSU;
    }
}