const { parseMessage } = require("./parser");
const { processAttachment } = require("./attachment");
const fs = require("fs");
const path = require("path");

let sock;
let connectedNumber = "-";

//-------------------------------------------------------
// WhatsApp Log File
//-------------------------------------------------------

const whatsappLogFile =
    path.join(__dirname, "WhatsApp_Log.txt");

//-------------------------------------------------------
// Write WhatsApp Log
//-------------------------------------------------------
function writeWhatsAppLog(
    direction,
    mode,
    type,
    sender,
    receiver,
    messageId,
    attachment = null,
    parseResult =null
)

{
/*console.log("\n========== LOG PARAMETERS ==========");
console.log("direction :", direction);
console.log("mode      :", mode);
console.log("type      :", type);
console.log("sender    :", sender);
console.log("receiver  :", receiver);
console.log("messageId :", messageId);
console.log("attachment:", attachment);
console.log("====================================\n");*/
    //---------------------------------------------------
    // Create Log File If Not Exists
    //---------------------------------------------------

    if (!fs.existsSync(whatsappLogFile))
{
    const header =
        "Timestamp\t\t   Way\t\tMode\t\tType\t\tSender\t\t\tReceiver\t\tMessageID\t\tAttachment\tParse\n";

    fs.writeFileSync(
        whatsappLogFile,
        header,
        "utf8"
    );
}

    //---------------------------------------------------
    // Timestamp
    //---------------------------------------------------

   const now = new Date();

const timestamp =
    now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).replace(",", "");
    //---------------------------------------------------
    // Attachment Information
    //---------------------------------------------------

    let attachmentInfo = "-";

    if (attachment)
    {

        attachmentInfo =
            `${attachment.filename || "-"} | ` +
            `${attachment.mimeType || "-"} | ` +
            `${attachment.size || 0}`;

    }

    //---------------------------------------------------
    // Log Entry
    //---------------------------------------------------

    const logEntry =
[
    timestamp,
    direction,
    mode,
    type,
    sender || "-",
    receiver || "-",
    messageId || "-",
    attachmentInfo,
    parseResult?.success === true
        ? "SUCCESS"
        : parseResult?.success === false
            ? "FAILED"
            : "-"
].join("\t    ") + "\n";
    //---------------------------------------------------
    // Append Log
    //---------------------------------------------------

    fs.appendFileSync(
    whatsappLogFile,
    logEntry,
    "utf8"
);

}

 //-------------------------------------------------------
// WhatsApp Group Cache
//-------------------------------------------------------

let groupCache = {};

const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const P = require("pino");

const {
    DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

/******************************************************************
 * Load WhatsApp Group Cache
 ******************************************************************/

async function loadGroupCache()
{

    const groups = await sock.groupFetchAllParticipating();

    groupCache = {};

    Object.keys(groups).forEach((id) => {

        groupCache[
            groups[id].subject.toUpperCase()
        ] = id;

    });

    console.log(
        `✅ Group Cache Loaded (${Object.keys(groupCache).length} Groups)\n`
    );

}

/******************************************************************
 * Start WhatsApp
 ******************************************************************/

async function startWhatsApp()
{

    const { state, saveCreds } =
        await useMultiFileAuthState("session");

    sock = makeWASocket({

        auth: state,

        logger: P({
            level: "silent"
        }),

        printQRInTerminal: false

    });

    //-------------------------------------------------------
    // Connection Update
    //-------------------------------------------------------

    sock.ev.on(
        "connection.update",
        async ({
            connection,
            qr,
            lastDisconnect
        }) => {

            //---------------------------------------------------
            // QR Code
            //---------------------------------------------------

            if (qr)
            {

                console.log( "\n📱 Scan this QR Code\n" );

                qrcode.generate(
                    qr,
                    {
                        small: true
                    }
                );

            }

            //---------------------------------------------------
            // WhatsApp Connected
            //---------------------------------------------------

            if (connection === "open")
            {

                 //-------------------------------------------------------
                // Connected WhatsApp Number
                //-------------------------------------------------------

             connectedNumber =
                sock.user?.id?.split(":")[0] || "-";
                console.log("\n✅ WhatsApp Connected Successfully:",connectedNumber);
                //console.log(
                //"WhatsApp Number :",
                //connectedNumber
               // );
               await loadGroupCache();

               /* console.log(
                    "Groups Cached :",
                    Object.keys(groupCache).length
                );
                    
                console.log(
                    "\n========== GROUPS ==========\n"
                );

                Object.keys(groupCache).forEach(
                    (groupName) => {

                        console.log(
                            groupName +
                            " ==> " +
                            groupCache[groupName]
                        );

                    }
                );

                console.log(
                    "\n============================\n"
                );*/

                //---------------------------------------------------
                // Startup Test Message
                //---------------------------------------------------

                await sock.sendMessage(

                    "120363426678265149@g.us",

                    {
                        text:
                            `🚀 Captain...HMIT Server Started. \n Date : ${new Date().toLocaleString()}`
                    }

                );

                console.log(
                    "✅ Test Message Sent Successfully.\n"
                );

            }

            //---------------------------------------------------
            // WhatsApp Disconnected
            //---------------------------------------------------

            if (connection === "close")
            {

                const shouldReconnect =
                    lastDisconnect?.error?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                console.log(
                    "\n❌ WhatsApp Disconnected."
                );

                console.dir(
                    lastDisconnect,
                    {
                        depth: null
                    }
                );

                if (shouldReconnect)
                {

                    console.log(
                        "\n🔄 Restarting WhatsApp...\n"
                    );

                    startWhatsApp();

                }

            }

        }
    );

    //-------------------------------------------------------
    // Credentials Update
    //-------------------------------------------------------

    sock.ev.on(
        "creds.update",
        saveCreds
    );

    //-------------------------------------------------------
    // Incoming Messages
    //-------------------------------------------------------

    sock.ev.on(
        "messages.upsert",
        async ({ messages }) => {

            const msg = messages[0];

            if (!msg.message)
                return;
            //---------------------------------------------------
            // Ignore Own Messages
            //---------------------------------------------------

                if (msg.key.fromMe)
                return;

            const from =
                msg.key.remoteJid;

                
            const senderNumber =
                (msg.key.participantAlt ||
                msg.key.remoteJidAlt ||
                msg.key.participant ||
                msg.key.remoteJid ||
                "-")
                .replace("@s.whatsapp.net", "")
                .replace("@lid", "");
            
            const isGroup =
                from.endsWith("@g.us");
            
            const mode =
                isGroup ? "GROUP" : "INDIV";
            
            const receiverNumber =
                connectedNumber;
            
            const messageId =
                msg.key.id || "-";

            let type = "TEXT";

                if (msg.message.documentMessage)
                    {
                        type = "DOCU";
                    }
                    else if (msg.message.imageMessage)
                    {
                        type = "IMAGE";
                    }
                    else if (msg.message.videoMessage)
                    {
                        type = "VIDEO";
                    }
                    else if (msg.message.audioMessage)
                    {
                        type = "AUDIO";
                    }


            let text = "";

            if (msg.message.conversation)
            {

                text =
                    msg.message.conversation;

            }
            else if (
                msg.message.extendedTextMessage
            )
            {

                text =
                    msg.message.extendedTextMessage.text;

            }
            else
            {

                return;

            }
           
             console.log(
                "\n=============================="
            );

            console.log(
                "NEW MESSAGE RECEIVED"
            );

            console.log(
                "=============================="
            );

            console.log(
                "FROM :",
                from
            );

            console.log(
                "NAME :",
                senderNumber
            );

            console.log(
                "TEXT :",
                text
            );

           const parserPayload = {
                key: text,
                sender: senderNumber
            };

           const parserResult =
                 await parseMessage(parserPayload);

                 //---------------------------------------------------
                // Parser Service Disabled
                //---------------------------------------------------

                if (
                    !parserResult.success &&
                    parserResult.code === "SERVICE_DISABLED"
                )
                {
                    await sendToMobile(
                        senderNumber,
                        parserResult.error
                    );

                    return;
                }

                console.log(
                    "PARSER RESULT :",
                    parserResult
                );

                console.log(
                    "==============================\n"
                );
            
                writeWhatsAppLog(
                    "IN",
                    mode,
                    type,
                    senderNumber,
                    receiverNumber,
                    messageId,
                    null,
                    parserResult
                );
        }
        
    );

}

//startWhatsApp();

/******************************************************************
 * Send WhatsApp Group Message
 ******************************************************************/

async function sendGroupMessage(
    groupName,
    message,
    attachment = null
)
{

    //-------------------------------------------------------
    // WhatsApp Connected ?
    //-------------------------------------------------------

    if (!sock)
    {

        throw new Error(
            "WhatsApp not connected."
        );

    }
//-------------------------------------------------------
// Process Attachment
//-------------------------------------------------------

let file = null;

if (attachment)
{
    console.log("Attachment Received :", attachment);

    file = await processAttachment(attachment);
}
    //-------------------------------------------------------
    // Search Group in Cache
    //-------------------------------------------------------

    let groupId =
        groupCache[
            groupName.toUpperCase()
        ];

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

        groupId =
            groupCache[
                groupName.toUpperCase()
            ];

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

    //-------------------------------------------------------
// Send Group Message
//-------------------------------------------------------

let sentMessage = null;

if (file)
{
    sentMessage =
        await sock.sendMessage(
            groupId,
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
    sentMessage =
        await sock.sendMessage(
            groupId,
            {
                text: message
            }
        );
}
//-------------------------------------------------------
// Log Outgoing Group Message
//-------------------------------------------------------

writeWhatsAppLog(
    "OUT",
    "GROUP",
    file ? "DOCU" : "TEXT",
    connectedNumber,
    groupName,
    sentMessage?.key?.id,
    file || null
);

    console.log(
        `\n✅ WhatsApp Group Message Sent : ${groupName}\n`
    );

    //-------------------------------------------------------
    // Return Baileys Result
    //-------------------------------------------------------

    return sentMessage;

}

/******************************************************************
 * Send WhatsApp to Mobile Number
 ******************************************************************/

async function sendToMobile(
    mobile,
    message,
    attachment = null
)
{

    let file = null;

    let sentMessage = null;

    //-------------------------------------------------------
    // Attachment
    //-------------------------------------------------------

    if (attachment)
    {

        console.log(
            "Attachment Received :",
            attachment
        );

        file =
            await processAttachment(
                attachment
            );

    }

    //-------------------------------------------------------
    // WhatsApp Connected ?
    //-------------------------------------------------------

    if (!sock)
    {

        throw new Error(
            "WhatsApp not connected."
        );

    }

    //-------------------------------------------------------
    // Normalize Mobile Number
    //-------------------------------------------------------

    mobile =
        String(mobile)
            .replace(/\D/g, "");

    //-------------------------------------------------------
    // Add India Country Code
    //-------------------------------------------------------

    if (mobile.length === 10)
    {

        mobile =
            "91" + mobile;

    }

    //-------------------------------------------------------
    // WhatsApp Chat ID
    //-------------------------------------------------------

    const chatId =
        mobile + "@s.whatsapp.net";

    //-------------------------------------------------------
    // Send Attachment
    //-------------------------------------------------------

    if (file)
    {

        sentMessage =
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

    //-------------------------------------------------------
    // Send Text
    //-------------------------------------------------------

    else
    {

        sentMessage =
            await sock.sendMessage(

                chatId,

                {

                    text: message

                }

            );

    }
//-------------------------------------------------------
// Log Outgoing Message
//-------------------------------------------------------

writeWhatsAppLog(
    "OUT",
    "INDIV",
    file ? "DOCU" : "TEXT",
    connectedNumber,
    mobile,
    sentMessage?.key?.id,
    file || null
);
    console.log(
        `\n✅ WhatsApp Sent To : ${mobile}\n`
    );

    //-------------------------------------------------------
    // Return Baileys Message Object
    //-------------------------------------------------------

    return sentMessage;

}



/******************************************************************
 * EXPORTS
 ******************************************************************/

module.exports = {

    startWhatsApp,

    sendGroupMessage,

    sendToMobile

};