
const { parseReply } = require("./parser");
const { processAttachment } = require("../../common/attachment");
let sock;

//-------------------------------------------------------
// WhatsApp Group Cache
//-------------------------------------------------------

let groupCache = {};

const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const P = require("pino");
const { DisconnectReason } = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

/******************************************************************
 * Load WhatsApp Group Cache
 ******************************************************************/
async function loadGroupCache()
{

    const groups = await sock.groupFetchAllParticipating();

    groupCache = {};

    Object.keys(groups).forEach((id) => {

        groupCache[groups[id].subject.toUpperCase()] = id;

    });

    console.log(

        `\n✅ Group Cache Loaded (${Object.keys(groupCache).length} Groups)\n`

    );

}

async function startWhatsApp() {

    const { state, saveCreds } =
        await useMultiFileAuthState("session");

    sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        printQRInTerminal: false
    });

  sock.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {

        if (qr) {

            console.log("\n📱 Scan this QR Code\n");

            qrcode.generate(qr, { small: true });

        }

        if (connection === "open") {

    console.log("\n✅ WhatsApp Connected Successfully.\n");

    await loadGroupCache();

    console.log("Groups Cached :", Object.keys(groupCache).length);

    console.log("\n========== GROUPS ==========\n");

    Object.keys(groupCache).forEach((groupName) => {

    console.log(

        groupName + " ==> " + groupCache[groupName]

    );

});

console.log("\n============================\n");

    await sock.sendMessage(
        "120363426678265149@g.us",
        {
            text:
`🚀 Captain...

HMIT Server Working Successfully.

Date : ${new Date().toLocaleString()}`
        }
    );

    console.log("\n✅ Test Message Sent Successfully.\n");

}

        if (connection === "close") {

    const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

    console.log("\n❌ WhatsApp Disconnected.");

    console.dir(lastDisconnect, { depth: null });

    if (shouldReconnect) {

        console.log("\n🔄 Restarting WhatsApp...\n");

        startWhatsApp();

    }

}
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];

    if (!msg.message) return;

    const from = msg.key.remoteJid;

    const sender = msg.pushName || "Unknown";

    let text = "";

    if (msg.message.conversation) {

        text = msg.message.conversation;

    } else if (msg.message.extendedTextMessage) {

        text = msg.message.extendedTextMessage.text;

    } else {

        return;

    }

    console.log("\n==============================");
    console.log("NEW MESSAGE RECEIVED");
    console.log("==============================");
    console.log("FROM :", from);
    console.log("NAME :", sender);
    console.log("TEXT :", text);

    const reply = parseReply(text);

    console.log("PARSED :", reply);

    console.log("==============================\n");

});

}

//startWhatsApp();
/******************************************************************
 * Send WhatsApp Group Message
 ******************************************************************/
async function sendGroupMessage(groupName, message)
{

    //-------------------------------------------------------
    // WhatsApp Connected ?
    //-------------------------------------------------------

    if (!sock)
    {

        throw new Error("WhatsApp not connected.");

    }

    //-------------------------------------------------------
    // Search Group in Cache
    //-------------------------------------------------------

    let groupId = groupCache[groupName.toUpperCase()];

    //-------------------------------------------------------
    // Cache Miss
    //-------------------------------------------------------

    if (!groupId)
    {

        console.log(

            `⚠️ Group '${groupName}' not found in cache. Reloading...`

        );

        await loadGroupCache();

        //---------------------------------------------------
        // Retry Search
        //---------------------------------------------------

        groupId = groupCache[groupName.toUpperCase()];

        if (!groupId)
        {

            throw new Error(

                `Group Not Found : ${groupName}`

            );

        }

    }

    //-------------------------------------------------------
    // Send WhatsApp Message
    //-------------------------------------------------------

    await sock.sendMessage(

        groupId,

        {

            text: message

        }

    );

    console.log(

        `\n✅ WhatsApp Group Message Sent : ${groupName}\n`

    );

}
/******************************************************************
 * Send WhatsApp to Mobile Number
 ******************************************************************/
async function sendToMobile(
    mobile,
    message,
    attachment = null
) {
    let file = null;
    if (attachment)
{
    console.log("Attachment Received :", attachment);
   file = await processAttachment(attachment);

}
    if (!sock) {
        throw new Error("WhatsApp not connected.");
    }

    // Remove spaces, +91, -, etc.
    mobile = String(mobile).replace(/\D/g, "");

    // Add India country code if only 10 digits
    if (mobile.length === 10) {
        mobile = "91" + mobile;
    }

    const chatId = mobile + "@s.whatsapp.net";

   if (file)
{

    await sock.sendMessage(

        chatId,

        {

            document: file.buffer,

            mimetype: file.mimeType,

            fileName: file.filename,

            caption: message

        }

    );

}
else
{

    await sock.sendMessage(

        chatId,

        {

            text: message

        }

    );

}
    console.log(`\n✅ WhatsApp Sent To : ${mobile}\n`);
}

/******************************************************************
 * EXPORTS
 ******************************************************************/
module.exports = {

    startWhatsApp,

    sendGroupMessage,

    sendToMobile

};