/******************************************************************
 * PROJECT  : AMAS
 * FILE     : whatsapp.js
 * VERSION  : 1.5
 * AUTHOR   : Rana Ravish + Jarvis
 * PURPOSE  : AMAS WhatsApp Engine
 ******************************************************************/

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const P = require("pino");
const qrcode = require("qrcode-terminal");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

let sock;
let connectedNumber = "-";
let amasGroupId = null;
let groupCache = {};

const TECHNICIAN_REPLY_CALLBACK =
    "https://script.google.com/macros/s/AKfycbybiFCfDybNBLN6wsGO13MkPc8-JhEDMbBcYf7lJvK3FkCvJPX1r5Ahzk-SR1KxQimy/exec";

const AMAS_GROUP_NAME = "CC_Test";

const whatsappLogFile =
    path.join(__dirname, "WhatsApp_Log.txt");

const messageStoreFile =
    path.join(__dirname, "message_store.json");


/******************************************************************
 * Message Store
 ******************************************************************/

function loadMessageStore()
{
    if (!fs.existsSync(messageStoreFile))
    {
        return {};
    }

    try
    {
        return JSON.parse(
            fs.readFileSync(
                messageStoreFile,
                "utf8"
            )
        );
    }
    catch (err)
    {
        console.log(
            "❌ Message Store Read Failed :",
            err.message
        );

        return {};
    }
}


function saveMessageStore(store)
{
    fs.writeFileSync(
        messageStoreFile,
        JSON.stringify(store),
        "utf8"
    );
}


function storeOutgoingMessage(message)
{
    if (!message?.key?.id)
    {
        return;
    }

    const store = loadMessageStore();

    store[message.key.id] = {
        key: message.key,
        message: message.message,
        messageTimestamp: message.messageTimestamp,
        status: message.status,
        participant: message.participant
    };

    saveMessageStore(store);
}


function getStoredMessage(messageId)
{
    if (!messageId)
    {
        return null;
    }

    const store = loadMessageStore();

    return store[messageId] || null;
}


/******************************************************************
 * Send To AMAS Bound Group
 ******************************************************************/

async function sendToAmasGroup(message, replyToMessageId = "")
{
    if (!amasGroupId)
    {
        throw new Error("AMAS group is not connected.");
    }

    return await sendGroupMessage(
        amasGroupId,
        message,
        replyToMessageId
    );
}


/******************************************************************
 * WhatsApp Log
 ******************************************************************/

function writeWhatsAppLog(
    direction,
    mode,
    type,
    sender,
    receiver,
    messageId,
    parseResult = null
)
{
    if (!fs.existsSync(whatsappLogFile))
    {
        const header =
            "Timestamp\t\tWay\t\tMode\t\tType\t\tSender\t\t\tReceiver\t\tMessageID\t\tParse\n";

        fs.writeFileSync(
            whatsappLogFile,
            header,
            "utf8"
        );
    }

    const now = new Date();

    const timestamp =
        now.toLocaleString(
            "en-IN",
            {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        ).replace(",", "");

    const parseStatus =
        parseResult?.success === true
            ? "SUCCESS"
            : parseResult?.success === false
                ? "FAILED"
                : "-";

    const logEntry = [
        timestamp,
        direction,
        mode,
        type,
        sender || "-",
        receiver || "-",
        messageId || "-",
        parseStatus
    ].join("\t") + "\n";

    fs.appendFileSync(
        whatsappLogFile,
        logEntry,
        "utf8"
    );
}


/******************************************************************
 * Load WhatsApp Groups
 ******************************************************************/

async function loadGroupCache()
{
    if (!sock)
    {
        throw new Error("WhatsApp not connected.");
    }

    const groups =
        await sock.groupFetchAllParticipating();

    groupCache = {};

    Object.keys(groups).forEach((id) =>
    {
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
        logger: P({ level: "silent" }),
        printQRInTerminal: false
    });


    //--------------------------------------------------
    // Connection
    //--------------------------------------------------

    sock.ev.on(
        "connection.update",
        async ({ connection, qr, lastDisconnect }) =>
        {
            if (qr)
            {
                console.log("\n📱 Scan this QR Code\n");

                qrcode.generate(
                    qr,
                    {
                        small: true
                    }
                );
            }

            if (connection === "open")
            {
                connectedNumber =
                    sock.user?.id?.split(":")[0] || "-";

                console.log(
                    "\n✅ WhatsApp Connected Successfully :",
                    connectedNumber
                );

                await loadGroupCache();

                amasGroupId =
                    groupCache[
                        AMAS_GROUP_NAME.toUpperCase()
                    ];

                if (!amasGroupId)
                {
                    console.log(
                        `❌ AMAS Group Not Found : ${AMAS_GROUP_NAME}`
                    );

                    return;
                }

                console.log(
                    `✅ AMAS Group : ${AMAS_GROUP_NAME} => ${amasGroupId}`
                );

                console.log(
                    "\n✅ AMAS WhatsApp Engine Ready.\n"
                );


                //--------------------------------------------------
                // Startup Test
                //--------------------------------------------------

                const startupMessage =
                    await sock.sendMessage(
                        amasGroupId,
                        {
                            text:
                                `🚀 Captain...IOCL_CC Server Started.\nDate : ${new Date().toLocaleString()}`
                        }
                    );

                storeOutgoingMessage(
                    startupMessage
                );

                console.log(
                    "✅ Test Message Sent Successfully.\n"
                );
            }

            if (connection === "close")
            {
                const shouldReconnect =
                    lastDisconnect?.error?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                console.log(
                    "\n❌ WhatsApp Disconnected."
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


    //--------------------------------------------------
    // Credentials
    //--------------------------------------------------

    sock.ev.on(
        "creds.update",
        saveCreds
    );


    //--------------------------------------------------
    // Incoming Messages
    //--------------------------------------------------

    sock.ev.on(
        "messages.upsert",
        async ({ messages }) =>
        {
            const msg = messages[0];

            if (!msg?.message)
            {
                return;
            }

            const from =
                msg.key.remoteJid || "-";

            if (from !== amasGroupId)
            {
                return;
            }

            const participant =
                msg.key.participant || "";

            const messageId =
                msg.key.id || "-";


            //--------------------------------------------------
            // Extract Text
            //--------------------------------------------------

            let text = "";

            if (msg.message.conversation)
            {
                text =
                    msg.message.conversation;
            }
            else if (msg.message.extendedTextMessage)
            {
                text =
                    msg.message.extendedTextMessage.text;
            }
            else
            {
                return;
            }


            //--------------------------------------------------
            // Reply Context
            //--------------------------------------------------

            const contextInfo =
                msg.message?.extendedTextMessage?.contextInfo;

            const stanzaId =
                contextInfo?.stanzaId || "";

            if (!stanzaId)
            {
                return;
            }


            //--------------------------------------------------
            // Command
            //--------------------------------------------------

            const command =
                String(text)
                    .trim()
                    .toUpperCase();

            const allowedCommands = [
                "ACK",
                "PENDING",
                "DONE"
            ];

            if (!allowedCommands.includes(command))
            {
                return;
            }


            //--------------------------------------------------
            // Sender
            //--------------------------------------------------

            const senderLid =
                participant;

            console.log(
                "\n======================================"
            );

            console.log(
                "AMAS TECHNICIAN REPLY"
            );

            console.log(
                "======================================"
            );

            console.log(
                "GROUP       :",
                from
            );

            console.log(
                "LID         :",
                senderLid
            );

            console.log(
                "TEXT        :",
                command
            );

            console.log(
                "REPLY TO ID :",
                stanzaId
            );

            console.log(
                "REPLY ID    :",
                messageId
            );


            //--------------------------------------------------
            // Resolve LID → Phone
            //--------------------------------------------------

            let phoneNumber = "";

            if (
                senderLid &&
                senderLid.endsWith("@lid")
            )
            {
                try
                {
                    const pn =
                        await sock
                            .signalRepository
                            .lidMapping
                            .getPNForLID(
                                senderLid
                            );

                    if (pn)
                    {
                        phoneNumber =
                            String(pn)
                                .replace(
                                    /@s\.whatsapp\.net$/i,
                                    ""
                                )
                                .split(":")[0]
                                .replace(/\D/g, "");

                        if (
                            phoneNumber.length === 12 &&
                            phoneNumber.startsWith("91")
                        )
                        {
                            phoneNumber =
                                phoneNumber.substring(2);
                        }
                    }
                }
                catch (err)
                {
                    console.log(
                        "❌ LID → PN Failed :",
                        err.message
                    );
                }
            }


            //--------------------------------------------------
            // Reply Event
            //--------------------------------------------------

            const replyEvent = {
                success: true,
                type: "TECHNICIAN_REPLY",
                complaintMessageId: stanzaId,
                replyMessageId: messageId,
                status: command,
                technicianLid: senderLid,
                technicianMobile: phoneNumber,
                groupId: from,
                timestamp: new Date().toISOString()
            };

            console.log(
                "PHONE       :",
                phoneNumber || "NOT RESOLVED"
            );

            console.log(
                "REPLY EVENT :",
                JSON.stringify(
                    replyEvent,
                    null,
                    2
                )
            );

            console.log(
                "======================================\n"
            );


            //--------------------------------------------------
            // Callback
            //--------------------------------------------------

            await processTechnicianReply(
                replyEvent
            );
        }
    );
}


/******************************************************************
 * Get Original Message For Reply
 ******************************************************************/

function getQuotedMessage(
    replyToMessageId,
    targetJid
)
{
    if (!replyToMessageId)
    {
        return null;
    }

    const originalMessage =
        getStoredMessage(
            replyToMessageId
        );

    if (!originalMessage)
    {
        console.log(
            "⚠️ Original Message Not Found :",
            replyToMessageId
        );

        return null;
    }

    if (
        originalMessage.key?.remoteJid !==
        targetJid
    )
    {
        console.log(
            "⚠️ Original Message Chat Mismatch :",
            replyToMessageId
        );

        return null;
    }

    return originalMessage;
}


/******************************************************************
 * Universal Group Message Sender
 ******************************************************************/

async function sendGroupMessage(
    groupId,
    message,
    replyToMessageId = ""
)
{
    if (!sock)
    {
        throw new Error(
            "WhatsApp not connected."
        );
    }

    if (!groupId)
    {
        throw new Error(
            "Group ID is required."
        );
    }

    const quotedMessage =
        getQuotedMessage(
            replyToMessageId,
            groupId
        );

    console.log(
        "========== QUOTED MESSAGE DEBUG =========="
    );

    console.log(
        "REPLY TO ID :",
        replyToMessageId
    );

    console.log(
        "QUOTED FOUND :",
        quotedMessage ? "YES" : "NO"
    );

    if (quotedMessage)
    {
        console.log(
            JSON.stringify(
                quotedMessage,
                null,
                2
            )
        );
    }

    console.log(
        "=========================================="
    );

    const sendOptions =
        quotedMessage
            ? {
                quoted: quotedMessage
            }
            : undefined;

    const sentMessage =
        await sock.sendMessage(
            groupId,
            {
                text: message
            },
            sendOptions
        );

    storeOutgoingMessage(
        sentMessage
    );

    writeWhatsAppLog(
        "OUT",
        "GROUP",
        "TEXT",
        connectedNumber,
        groupId,
        sentMessage?.key?.id
    );

    console.log(
        `\n✅ WhatsApp Group Message Sent : ${groupId}\n`
    );

    if (replyToMessageId)
    {
        console.log(
            "↳ REPLY TO MESSAGE :",
            replyToMessageId
        );
    }

    return sentMessage;
}


/******************************************************************
 * Universal Mobile Message Sender
 ******************************************************************/

async function sendToMobile(
    mobile,
    message,
    replyToMessageId = ""
)
{
    if (!sock)
    {
        throw new Error(
            "WhatsApp not connected."
        );
    }

    mobile =
        String(mobile)
            .replace(/\D/g, "");

    if (mobile.length === 10)
    {
        mobile =
            "91" + mobile;
    }

    const chatId =
        mobile + "@s.whatsapp.net";

    const quotedMessage =
        getQuotedMessage(
            replyToMessageId,
            chatId
        );

    const sendOptions =
        quotedMessage
            ? {
                quoted: quotedMessage
            }
            : undefined;

    const sentMessage =
        await sock.sendMessage(
            chatId,
            {
                text: message
            },
            sendOptions
        );

    storeOutgoingMessage(
        sentMessage
    );

    writeWhatsAppLog(
        "OUT",
        "INDIV",
        "TEXT",
        connectedNumber,
        mobile,
        sentMessage?.key?.id
    );

    console.log(
        `\n✅ WhatsApp Sent To : ${mobile}\n`
    );

    if (replyToMessageId)
    {
        console.log(
            "↳ REPLY TO MESSAGE :",
            replyToMessageId
        );
    }

    return sentMessage;
}


/******************************************************************
 * Process Technician Reply
 ******************************************************************/

async function processTechnicianReply(
    replyEvent
)
{
    try
    {
        const response =
            await axios.post(
                TECHNICIAN_REPLY_CALLBACK,
                replyEvent,
                {
                    timeout: 30000,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        console.log(
            "✅ Technician Reply Callback Sent"
        );

        console.log(
            "CALLBACK STATUS :",
            response.status
        );

        console.log(
            "CALLBACK RESPONSE :",
            response.data
        );

        return {
            success: true,
            response: response.data
        };
    }
    catch (err)
    {
        console.log(
            "❌ Technician Reply Callback Failed"
        );

        console.log(
            err.response?.data ||
            err.message
        );

        return {
            success: false,
            code: "CALLBACK_FAILED",
            error:
                err.response?.data ||
                err.message
        };
    }
}


/******************************************************************
 * Exports
 ******************************************************************/

module.exports = {
    startWhatsApp,
    sendGroupMessage,
    sendToMobile,
    sendToAmasGroup
};