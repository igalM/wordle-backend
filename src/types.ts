export interface IRoom {
    [key: string]: User[];
}

export interface User {
    id: string;
    nickname: string;
}