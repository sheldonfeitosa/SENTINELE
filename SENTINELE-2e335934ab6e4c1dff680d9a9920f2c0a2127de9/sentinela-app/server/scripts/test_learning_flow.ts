
import { NotificationRepository } from './src/repositories/notification.repository';
import { AIService } from './src/services/ai.service';
import { NotificationService } from './src/services/notification.service';
import dotenv from 'dotenv';

dotenv.config();

// Mock dependencies to avoid full AI call if desired, or use real one.
// We want to test logic flow.

async function testLearning() {
    const repo = new NotificationRepository();
    // We can't easily mock repo here without dependency injection or jest, 
    // but we can call the actual query to see if it runs.

    console.log("Testing findSimilarResolved...");
    try {
        const history = await repo.findSimilarResolved("QUEDA", 3);
        console.log("History found:", history.length);
        if (history.length > 0) {
            console.log("Sample:", history[0].description);
        } else {
            console.log("No concluded 'QUEDA' incidents found. Seeding one might be needed for full test.");
        }
    } catch (e) {
        console.error("Repo Error:", e);
    }
}

testLearning();
