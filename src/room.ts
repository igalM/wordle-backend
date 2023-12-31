import { v4 as uuidv4 } from 'uuid';
import { IRoom, User } from './types';

export const MAX_ROOM_CAPACITY = 2;

export class Rooms {
    private state: IRoom;

    constructor() {
        this.state = {};
    }

    joinRoom(id: string, nickname: string): Promise<string> {
        const data = { id, nickname };

        return new Promise<string>((resolve) => {
            for (const roomId in this.state) {
                const room = this.state[roomId];
                if (room.length < MAX_ROOM_CAPACITY) {
                    const updatedRooms = {
                        ...this.state,
                        [roomId]: [...room, data]
                    }
                    this.state = updatedRooms;
                    return resolve(roomId);
                }
            }

            const roomId = uuidv4();

            const updatedRooms = {
                ...this.state,
                [roomId]: [data]
            }

            this.state = updatedRooms;
            return resolve(roomId);
        });
    }

    leaveRoom(id: string): Promise<string | null> {
        return new Promise((resolve) => {
            for (const roomId in this.state) {
                const room = this.state[roomId];
                if (room.findIndex(user => user.id === id) !== -1) {
                    delete this.state[roomId];
                    return resolve(roomId);
                }
            }

            resolve(null);
        });
    }

    getRoom(roomId: string): Promise<User[]> {
        return new Promise((resolve, reject) => {
            if (roomId in this.state) {
                resolve(this.state[roomId]);
            } else {
                reject(new Error('Room doesnt exist'));
            }
        })
    }
}