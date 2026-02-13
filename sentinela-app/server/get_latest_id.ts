import axios from 'axios';

async function getLatestId() {
    try {
        const response = await axios.get('http://localhost:3001/api/notifications');
        const notifications = response.data;
        if (notifications.length > 0) {
            const last = notifications[notifications.length - 1];
            console.log(`ID: ${last.id}`);
            console.log(`Description: ${last.descricao_detalhada}`);
        } else {
            console.log("No notifications found.");
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

getLatestId();
