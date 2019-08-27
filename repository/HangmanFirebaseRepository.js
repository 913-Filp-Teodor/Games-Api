const GamesFirebaseRepository = require('./GamesFirebaseRepository');
const HangmanModel = require('../model/HangmanModel');
const getRandomItem = require('../utilities/getRandomItem');
const isLetter = require('../utilities/isLetter');
class HangmanFirebaseRepository extends GamesFirebaseRepository {
    constructor(db) {
        super(db, 'games');

        this._gameKey = "8jmng49yYAUjO8nyDU03";

        this._sessionsPath = "games/8jmng49yYAUjO8nyDU03/sessions";

        this._phrasesPath = "games/8jmng49yYAUjO8nyDU03/phrases";

        this.model = new HangmanModel();
    } 

    async addSession() {

        return await super.addSession(this._gameKey, await this.getRandomSession());
    }

    async getRandomSession() {

        let phraseInfo = await this.getRandomPhrase();
        let session = Object.assign({}, this.model.session);

        session.phrase = phraseInfo.phrase;
        session.phraseCategory = phraseInfo.category;

        this.addPhraseLetters(session);
        this.setupCompletedPhrase(session);
        return session;
    }

    addPhraseLetters(session) {
        let foundLetters = {};
        let phrase = session.phrase;

        for(var pos in phrase) {
            if(!foundLetters.hasOwnProperty(phrase[pos]) && isLetter(phrase[pos]))
                foundLetters[phrase[pos]] = 1;
            else if (foundLetters.hasOwnProperty(phrase[pos]) && isLetter(phrase[pos]))
                foundLetters[phrase[pos]] = foundLetters[phrase[pos]] + 1;
        }

        session.phraseLetters = foundLetters;
    }

    setupCompletedPhrase(session) {

        let phrase = session.phrase;
        let completedPhrase = [];

        for(var pos in phrase) {
            if(isLetter(phrase[pos]))
                completedPhrase.push('');
            else
                completedPhrase.push(phrase[pos]);
        }

        session.completedPhrase = completedPhrase;
    }
    
    getSession(cb) {
        return super.getSession(this._gameKey, cb);
    }
    async addSession() {
        return await super.addSession(this._gameKey, this.model.session);
    }

    async setSentences(category, sentences) {
        let path = this._phrasesPath;

        this._database.collection(path).doc(category).set({ sentences }, { merge: true });
    }

    async getPhrase(sessionKey) {
        let docRef = await this._database.collection(this._sessionsPath).doc(sessionKey).get();

        return docRef.data().phrase;
    }

    getPhrasesByCategory(){
        let sentencesByCategory = {};
        return this._database.collection(`games/${this._gameKey}/phrases`).get().then(snapshot => {
            snapshot.forEach(doc => sentencesByCategory[doc.id] = doc.data());
            return Promise.resolve(sentencesByCategory);
        });
    }

    getRandomPhrase(){

        return this.getPhrasesByCategory().then(result => {

            let randomCategory = getRandomItem(Object.keys(result));

            let chosenSentence = getRandomItem(result[randomCategory].sentences);
            
            return Promise.resolve({category: randomCategory, phrase: chosenSentence});
            
        });
    }
    
    async getSessionByKey(sessionKey) {
        let path = "games/" + this._gameKey + "/sessions";

        return await this._database.collection(path).doc(sessionKey).get().then((session) => { return session.data() });
    }

    async checkLetter(sessionKey, letter) {
        let phrase = await this.getPhrase(sessionKey);

        let result = phrase.search(letter);

        if (result == -1) {
            return false;
        }

        return true;
    }

    async addUser(userKey, sessionKey) {
        let path = this._sessionsPath;

        let user = {};
        user[userKey] = { lives: 4, score: 0 };

        this._database.collection(path).doc(sessionKey).set({ users: user }, { merge: true });
    }

    async getUser(userKey, sessionKey) {
        let path = this._sessionsPath;

        return await this._database.collection(path).doc(sessionKey).get().then((d) => { return d.data().users[userKey] });
    }

    async getLetterScore(sessionKey, letter) {
        let docRef = await this._database.collection(this._sessionsPath).doc(sessionKey).get();

        return docRef.data().phraseLetters[letter];
    }

    async addGuessedLetter(sessionKey, letter) {
        let path = this._sessionsPath;

        this._database.collection(path).doc(sessionKey).set({ guessedLetters: letter }, { merge: true });
    }
    async isLetterGuessed(sessionKey, letter) {

        let docRef = await this._database.collection(this._sessionsPath).doc(sessionKey).get();

        let guessedLetters = docRef.data().guessedLetters;

        for (var i = 0; i < guessedLetters.length; i++) {

            if (guessedLetters[i] === letter) {

                return true;
            }
        }
        return false;
    }

    async getCompletedPhrase(sessionKey) {
        let docRef = await this._database.collection(this._sessionsPath).doc(sessionKey).get();

        return docRef.data().completedPhrase;
    }

    async setCompletedPhrase(sessionKey, newCompletedPhrase) {
        let path = this._sessionsPath;

        this._database.collection(path).doc(sessionKey).set({ completedPhrase: newCompletedPhrase }, { merge: true });
    }

    async updateCompletedPhrase(sessionKey, letter) {
        let completedPhrase = await this.getCompletedPhrase(sessionKey);
        let phrase = await this.getPhrase(sessionKey);

        for (var i = 0; i < phrase.length; i++) {
            if (phrase[i] === letter) {
                completedPhrase[i] = letter;
            }
        }
        this.setCompletedPhrase(sessionKey, completedPhrase);
    }

    async isPhraseComplete(sessionKey) {
        let phrase = await this.getCompletedPhrase(sessionKey);

        function isEmpty(letter) {
            return letter === "";
        }

        return phrase.find(isEmpty) != "";
    }

    async isGameEnded(sessionKey) {
        let isComplete = await this.isPhraseComplete(sessionKey);
        if (isComplete === true) {
            let path = this._sessionsPath;

            this._database.collection(path).doc(sessionKey).set({ gameEnded: true }, { merge: true });
            return true;
        }
        return false;
    }
    
    async increaseScore(userKey, sessionKey, letter) {
        let path = this._sessionsPath;

        let user = await this.getUser(userKey, sessionKey);
        let points = await this.getLetterScore(sessionKey, letter);

        let newUser = {};
        let obj = {};
        obj.lives = user.lives;
        obj.score = user.score + points;
        newUser[userKey] = obj;

        this._database.collection(path).doc(sessionKey).set({ users: newUser }, { merge: true });
    }


    async decreaseLives(userKey, sessionKey) {
        let path = this._sessionsPath;

        let user = await this.getUser(userKey, sessionKey);

        let newUser = {};
        let obj = {};
        obj.lives = user.lives - 1;
        obj.score = user.score;
        newUser[userKey] = obj;

        this._database.collection(path).doc(sessionKey).set({ users: newUser }, { merge: true });
    }

    async registerLetter(userKey, sessionKey, letter) {
        
        if (await (this.isGameEnded(sessionKey)) === false) {
            if (await (this.isLetterGuessed(sessionKey, letter)) === false) {
                if (await (this.checkLetter(sessionKey, letter)) === true) {
                    this.increaseScore(userKey, sessionKey, letter);
                    this.addGuessedLetter(sessionKey, letter);
                    this.updateCompletedPhrase(sessionKey, letter);
                }
                else {
                    this.decreaseLives(userKey, sessionKey);
                }
            }
        }
        else return;
    }
}

module.exports = HangmanFirebaseRepository;


