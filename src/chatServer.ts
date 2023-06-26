import * as express from 'express';
import * as socketIo from 'socket.io';
import { ChatEvent } from './events';
import { createServer, Server } from 'http';
import * as cors from 'cors';
import { MAX_ROOM_CAPACITY, Rooms } from './room';
import { WORDS } from './wordslist';

export class ChatServer {
    public static readonly PORT: number = 8081;
    private _app: express.Application;
    private server: Server;
    private io: socketIo.Server;
    private port: string | number;
    private rooms: Rooms;

    constructor() {
        this._app = express();
        this.port = process.env.PORT || ChatServer.PORT;
        this._app.use(cors());
        this._app.options('*', cors());
        this.server = createServer(this._app);
        this.rooms = new Rooms();
        this.initSocket();
        this.listen();
    }

    private initSocket(): void {
        this.io = new socketIo.Server(this.server, {
            cors: {
                origin: "http://localhost:5173"
            }
        });
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on(ChatEvent.CONNECT, async (socket: socketIo.Socket) => {

            socket.on(ChatEvent.JOIN_ROOM, async ({ name }) => {
                const roomId = await this.rooms.joinRoom(socket.id, name);
                const room = await this.rooms.getRoom(roomId);

                socket.join(roomId);

                if (room.length === MAX_ROOM_CAPACITY) {
                    const word = this.getRandomWord();

                    const { id: playerOneId, nickname: playerOneName } = room[0];
                    const { id: playerTwoId, nickname: playerTwoName } = room[1];
                    this.io.to(playerOneId).emit(ChatEvent.START_GAME, { name: playerTwoName, roomId, word });
                    this.io.to(playerTwoId).emit(ChatEvent.START_GAME, { name: playerOneName, roomId, word });
                }
            });

            socket.on(ChatEvent.GUESS, async ({ roomId, row, turn }) => {
                socket.to(roomId).emit(ChatEvent.MESSAGE, { row, turn });
            });

            socket.on(ChatEvent.DISCONNECT, () => {
                //TO-DO: game over event?
                this.rooms.leaveRoom(socket.id);
            });
        });
    }

    private getRandomWord(): string {
        return WORDS[Math.floor(Math.random() * WORDS.length)];
    }

    get app(): express.Application {
        return this._app;
    }
}