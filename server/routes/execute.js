const express = require('express');
const router = express.Router();
const { executeCode } = require('../services/codeExecution');


router.post('/', async (req, res) => {
  try {
    const { language, code, stdin } = req.body;
    
    if (!language || !code) {
      return res.status(400).json({ success: false, error: 'Language and code are required.' });
    }

    const result = await executeCode(language, code, stdin);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Execution Route Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred during code execution.' 
    });
  }
});

module.exports = router;
