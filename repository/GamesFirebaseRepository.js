const FirebaseRepository = require('./FirebaseRepository');
const GameModel = require('../model/GameModel');

class GamesFirebaseRepository extends FirebaseRepository {
    constructor(db) {
        super(db, 'games');
        this.model = new GameModel();
    }

   
    async setSession(gameKey,sessionKey,item){

        let path = "games/" + gameKey + "/sessions";

        let documentRef = this._database.collection(path).doc(sessionKey);

        delete item.id;

        await documentRef.set(item, {merge: true});
    }

    async addSession(gameKey,session) {

        let path = "games/" + gameKey + "/sessions";

        let documentRef = await this._database.collection(path).add(session);
        
        return await this._database.collection(path).doc(documentRef.id).get().then((doc)=>{return doc.data()});

    }

    async setSessionField(gameKey,sessionKey,item){

        await this.setSession(gameKey,sessionKey,item);
    
        return "added";
     }
    
   async getSession(gameKey,cb) { 
       let path = "games/" + gameKey + "/sessions";

       this._database.collection(path)
                   .where("availablePlaces",">",0)
                   .limit(1)
                   .get()
                   .then((querySnapshot) => {
                        if(querySnapshot.empty === true) 
                        {    
                            cb(null);
                        }
                       else
                       {   
                           cb(querySnapshot.docs[0].data()) ;
                       }

                   });
   }

}

module.exports = GamesFirebaseRepository;