const GamesFirebaseRepository = require('./GamesFirebaseRepository');
const HangmanModel = require('../model/HangmanModel');

class HangmanFirebaseRepository extends GamesFirebaseRepository {
    constructor(db) {
        super(db, 'games');
        
        this._gameKey = "8jmng49yYAUjO8nyDU03";

        this._sessionsPath ="games/8jmng49yYAUjO8nyDU03/sessions";

        this._phrasesPath="games/8jmng49yYAUjO8nyDU03/phrases";

        this.model = new HangmanModel();
    }

    async addSession() {
        super.addSession(this.model.session);
    }

    async setSentences(category, sentences) {

        let path = this._phrasesPath;

        this._database.collection(path).doc(category).set({ sentences } ,{ merge : true });
    }

}

module.exports = HangmanFirebaseRepository;