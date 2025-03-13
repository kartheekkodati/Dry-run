const express = require('express');
const router = express.Router();
const Code = require('../models/Code');

// Get all code snippets
router.get('/code', async (req, res) => {
  try {
    const codes = await Code.find().sort({ updatedAt: -1 });
    res.json(codes);
  } catch (error) {
    console.error('Error fetching code snippets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific code snippet
router.get('/code/:id', async (req, res) => {
  try {
    const code = await Code.findById(req.params.id);
    
    if (!code) {
      return res.status(404).json({ message: 'Code not found' });
    }
    
    res.json(code);
  } catch (error) {
    console.error('Error fetching code snippet:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Code not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new code snippet
router.post('/code', async (req, res) => {
  const { title, code, language } = req.body;
  
  if (!title || !code || !language) {
    return res.status(400).json({ message: 'Title, code, and language are required' });
  }
  
  try {
    const newCode = new Code({
      title,
      code,
      language
    });
    
    const savedCode = await newCode.save();
    res.status(201).json(savedCode);
  } catch (error) {
    console.error('Error saving code snippet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a code snippet
router.put('/code/:id', async (req, res) => {
  const { title, code, language } = req.body;
  
  if (!title && !code && !language) {
    return res.status(400).json({ message: 'At least one field to update is required' });
  }
  
  try {
    const codeSnippet = await Code.findById(req.params.id);
    
    if (!codeSnippet) {
      return res.status(404).json({ message: 'Code not found' });
    }
    
    if (title) codeSnippet.title = title;
    if (code) codeSnippet.code = code;
    if (language) codeSnippet.language = language;
    codeSnippet.updatedAt = Date.now();
    
    const updatedCode = await codeSnippet.save();
    res.json(updatedCode);
  } catch (error) {
    console.error('Error updating code snippet:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Code not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a code snippet
router.delete('/code/:id', async (req, res) => {
  try {
    const codeSnippet = await Code.findById(req.params.id);
    
    if (!codeSnippet) {
      return res.status(404).json({ message: 'Code not found' });
    }
    
    await codeSnippet.deleteOne();
    res.json({ message: 'Code snippet removed' });
  } catch (error) {
    console.error('Error deleting code snippet:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Code not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;