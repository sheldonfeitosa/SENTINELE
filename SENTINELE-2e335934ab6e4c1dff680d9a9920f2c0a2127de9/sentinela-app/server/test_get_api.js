fetch('http://localhost:3001/api/notifications')
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);
