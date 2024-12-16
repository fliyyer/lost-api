const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes); 

sequelize.authenticate()
  .then(() => console.log('Database connected!'))
  .catch((err) => console.log('Database connection error: ' + err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const fs = require('fs');

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
