const express = require('express');
const fs = require('fs');
const path = require('path');
const Item = require('../models/itemModel');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware ');
const multer = require('multer');

const router = express.Router();

router.get('/', async (req, res) => {
  const { status, claimed } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (claimed === 'true') {
    filter.claimedBy = { [Op.not]: null }; 
  } else if (claimed === 'false') {
    filter.claimedBy = null; 
  }
  try {
    const items = await Item.findAll({ where: filter });
    return res.status(200).json({
      message: 'Items retrieved successfully.',
      items,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while fetching items.' });
  }
});

router.get('/details/:id', async (req, res) => {
  const { id } = req.params;
  try { 
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    return res.status(200).json({
      message: 'Item details retrieved successfully.',
      item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while fetching item details.' });
  }
});


router.get('/search', async (req, res) => {
  const { name, category, lastLocation, date } = req.query;
  const filter = {};
  if (name) {
    filter.name = { [Op.like]: `%${name}%` }; 
  }
  if (category) {
    filter.category = { [Op.like]: `%${category}%` };
  }
  if (lastLocation) {
    filter.lastLocation = { [Op.like]: `%${lastLocation}%` };
  }
  if (date) {
    filter.date = date; 
  }
  try {
    const items = await Item.findAll({ where: filter });
    return res.status(200).json({
      message: 'Items retrieved successfully.',
      items,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while searching for items.' });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['Checking', 'Accepted', 'Available'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }
  try {
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    item.status = status;
    await item.save();
    return res.status(200).json({ message: 'Item status updated successfully.', item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while updating the item status.' });
  }
});

// fungsi untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, './uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
  }
});

router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
  const { name, category, lastLocation, date, description, claimedBy, status } = req.body;
  if (!name || !category || !lastLocation || !date) {
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }

  let photoFilename = null;
  if (req.file) {
    photoFilename = req.file.filename;
  }

  try {
    const newItem = await Item.create({
      name,
      category,
      lastLocation,
      date,
      description: description || '',
      photo: photoFilename,
      claimedBy,
      status
    });

    return res.status(201).json({ message: 'Item uploaded successfully!', item: newItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while uploading the item.' });
  }
});

router.put('/:id/claim', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body; 
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required to claim an item.' });
  }
  try {
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    if (item.claimedBy) {
      return res.status(400).json({ message: 'Item is already claimed.' });
    }
    item.claimedBy = userId; 
    item.status = 'Checking'; 
    await item.save();
    return res.status(200).json({ message: 'Item claimed successfully.', item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while claiming the item.' });
  }
});


router.put('/:id/accept', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role; 

  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Only admins can accept items.' });
  }

  try {
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    if (!item.claimedBy) {
      return res.status(400).json({ message: 'Item has not been claimed yet.' });
    }
    
    if (item.status !== 'Checking') {
      return res.status(400).json({ message: 'Item can only be accepted if its status is Checking.' });
    }
    item.status = 'Accepted'; 
    await item.save();
    return res.status(200).json({ message: 'Item accepted successfully.', item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while accepting the item.' });
  }
});


module.exports = router;
