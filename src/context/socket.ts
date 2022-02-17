import React from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/config';

export const socket = io(SOCKET_URL);
export const SocketContext = React.createContext<Socket>(socket);
