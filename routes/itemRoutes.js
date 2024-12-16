const express = require('express');
const fs = require('fs');
const path = require('path');
const Item = require('../models/itemModel');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Item.findAll();
    return res.status(200).json({
      message: 'Items retrieved successfully.',
      items,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while fetching items.' });
  }
});

router.post('/upload', async (req, res) => {
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
