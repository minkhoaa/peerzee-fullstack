import { io, Socket } from "socket.io-client";


let socket: Socket | null = null;
export function getSocket() {
    return socket;
}
export function connectSocket(token: string) {
    if (socket?.connected) return socket;
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    socket = io(`${baseUrl}/socket/chat`, {
        auth: { token },
        transports: ['websocket'],
    });
    return socket;
}
export function disconnectSocket() {
    if (socket?.connected) socket.disconnect();
    socket = null;
}