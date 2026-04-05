const { Resend } = require('./server/node_modules/resend');

async function main() {
    const resend = new Resend('re_7CL1rTc8_LUt2xuysNFWidDnQf2UbZRGW');
    console.log("Testing fallback...");
    try {
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'sheldonfeitosa@gmail.com',
            subject: 'Test',
            html: 'Test'
        });
        console.log("Fallback result:", result);
    } catch(e) {
        console.error("Fallback error:", e);
    }
}
main();
