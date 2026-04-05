const { Resend } = require('./server/node_modules/resend');

async function main() {
    const resend = new Resend('re_7CL1rTc8_LUt2xuysNFWidDnQf2UbZRGW');
    console.log("Testing primary...");
    try {
        const result = await resend.emails.send({
            from: 'Sentinela AI <nao-responda@sentinelaai.com.br>',
            to: 'sheldon@inmceb.med.br',
            subject: 'Test',
            html: 'Test'
        });
        console.log("Primary result:", result);
    } catch(e) {
        console.error("Primary error:", e);
    }
}
main();
