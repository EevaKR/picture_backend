const express = require('express');
const app = express();
const port = 3001;

app.get('/api/frontpage', (req, res) => {
res.json({ message: 'This is frontpage' });
});

app.listen(port, () => {
console.log('Server is running at http://localhost:${port}');
});
