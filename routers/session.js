var router = require('express').Router();
const hangmanService = require('../service/hangmanService');

router.post('/hangman/getNewSession', hangmanService.getNewSession); 

router.post('/hangman/removeUserFromSession', hangmanService.removeUserFromSession);

module.exports = router;