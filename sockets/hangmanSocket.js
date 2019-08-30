let hangmanService = require('../service/hangmanService');
let gamesService = require('../service/gamesService');

const isNewSession = (gameData, sessionKey) => {
    if(gameData.hasOwnProperty(sessionKey) && !gameData[sessionKey].data)
        return true;
    return !gameData.hasOwnProperty(sessionKey);
}

const createSession = async (gameData, sessionKey) => {
    gameData[sessionKey] = {};
    let session = await hangmanService.getSessionByKey(sessionKey);
    gameData[sessionKey].data = session.data;
    gameData[sessionKey].messages = [];
}

const getSessionMessages = (gameData, sessionKey) => {

    if(!gameData.hasOwnProperty(sessionKey)) 
        throw new Error('No session has been found for the given key');
    
    return gameData[sessionKey].messages;
    
}

const getSessionData = (gameData) => {
    return (sessionKey) => {
        if(!gameData.hasOwnProperty(sessionKey))
            throw new Error('No session has been found for the given key');
        
        return {
            data: gameData[sessionKey].data,
            id: sessionKey
        }
    }
}

module.exports = function(io, getSession, gameData) {

    io.of('/hangman').on('connection', async (socket) => {
        
        let sessionName = socket.handshake.query.roomName;
        let userId = socket.handshake.query.userId;

        if(isNewSession(gameData, sessionName))
            await createSession(gameData, sessionName);

        socket.join(sessionName, () => {
            hangmanService.addUserToSession(userId, sessionName, getSessionData(gameData));

            socket.emit('sessionUpdated', getSessionData(gameData)(sessionName));
            socket.emit('getMessages', getSessionMessages(gameData, sessionName));

            const hangmanSocketService = hangmanService.getHangmanSocketService(socket, getSession, getSessionData(gameData));
            const gameSocketService = gamesService.getGamesSocketService(socket, getSession, getSessionMessages(gameData, sessionName));

            socket.on('newMessage', gameSocketService.handleChat);
            socket.on('letterPressed', hangmanSocketService.letterPressed);

        });
        
    });
}