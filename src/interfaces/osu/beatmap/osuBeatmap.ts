export interface OsuBeatmap {
    beatmapset_id: number;
    difficulty_rating: number;
    id: number;
    mode: string;
    status: string;
    total_length: number;
    user_id: number;
    version: string;
    accuracy: number;
    ar: number;
    bpm: number;
    convert: boolean;
    count_circles: number;
    count_sliders: number;
    count_spinners: number;
    cs: number;
    deleted_at: string;
    drain: number;
    hit_length: number;
    is_scoreable: boolean;
    last_updated: string;
    mode_int: number;
    passcount: number;
    playcount: number;
    ranked: number;
    url: string;
    checksum: string;
    beatmapset: Beatmapset;
    failtimes: {
        fail: number[];
        exit: number[];
    };
    max_combo: number;
}

interface Beatmapset {
    artist: string;
    artist_unicode: string;
    covers: {
        cover: string;
        'cover@2x': string;
        card: string;
        'card@2x': string;
        list: string;
        'list@2x': string;
        slimcover: string;
        'slimcover@2x': string;
    };
    creator: string;
    favourite_count: number;
    hype: any; // Replace 'any' with a more specific type if possible
    id: number;
    nsfw: boolean;
    offset: number;
    play_count: number;
    preview_url: string;
    source: string;
    spotlight: boolean;
    status: string;
    title: string;
    title_unicode: string;
    track_id?: string; // Optional field
    user_id: number;
    video: boolean;
    bpm?: number; // Optional field
    can_be_hyped?: boolean; // Optional field
    deleted_at?: string; // Optional field
    discussion_enabled?: boolean; // Optional field
    discussion_locked?: boolean; // Optional field
    is_scoreable?: boolean; // Optional field
    last_updated?: string; // Optional field
    legacy_thread_url?: string; // Optional field
    nominations_summary?: {
        current: number;
        required: number;
    };
    ranked?: number; // Optional field
    ranked_date?: string; // Optional field
    storyboard?: boolean; // Optional field
    submitted_date?: string; // Optional field
    tags?: string; // Optional field
    availability?: {
        download_disabled: boolean;
        more_information?: string; // Optional field
    };
    has_favourited?: boolean; // Optional field
    ratings?: number[]; // Optional field
}
