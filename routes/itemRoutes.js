const express = require('express');
const fs = require('fs');
const path = require('path');
const Item = require('../models/itemModel');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware ');

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

router.get('/:id', async (req, res) => {
  const { id } = req.params;  
  try {
    const item = await Item.findByPk(id); 
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    return res.status(200).json({
      message: 'Item retrieved successfully.',
      item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while fetching the item.' });
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
  if (!['Checking', 'Accepted'].includes(status)) {
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
    await item.save();
    return res.status(200).json({ message: 'Item claimed successfully.', item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while claiming the item.' });
  }
});

router.post('/upload', authenticateToken, async (req, res) => {
  const { name, category, lastLocation, date, description, photo } = req.body;
  if (!name || !category || !lastLocation || !date) {
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }
  let photoFilename = null;
  if (photo) {
    try {
      const base64Pattern = /^data:image\/(jpeg|png|jpg);base64,/;
      if (!base64Pattern.test(photo)) {
        return res.status(400).json({ message: 'Invalid photo format. Only .jpg, .jpeg, and .png are allowed.' });
      }
      const fileExtension = photo.match(base64Pattern)[1];
      const base64Data = photo.replace(base64Pattern, '');
      photoFilename = `${Date.now()}.${fileExtension}`;
      const uploadPath = path.join(__dirname, './uploads', photoFilename);
      fs.writeFileSync(uploadPath, Buffer.from(base64Data, 'base64'));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'An error occurred while processing the photo.' });
    }
  }

  try {
    const newItem = await Item.create({
      name,
      category,
      lastLocation,
      date,
      description: description || '',
      photo: photoFilename,
    });

    return res.status(201).json({ message: 'Item uploaded successfully!', item: newItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while uploading the item.' });
  }
});

module.exports = router;
