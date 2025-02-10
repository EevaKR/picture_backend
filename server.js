const express = require('express');
const app = express();


app.get('/api/frontpage', (req, res) => {
res.json({ message: 'This is frontpage' });
});

app.listen(3000, () => {
console.log('Server is running at http://localhost:3000');
});
