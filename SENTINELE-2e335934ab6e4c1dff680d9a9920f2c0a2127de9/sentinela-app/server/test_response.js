
fetch('http://localhost:3001/api/notifications')
    .then(res => res.json())
    .then(data => console.log('Count:', data.length))
    .catch(err => console.error('Error:', err.message));
