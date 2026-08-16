/******************************************************************
 * PROJECT  : AMAS
 * FILE     : amas_server_3001.js
 * VERSION  : 1.3
 * AUTHOR   : Rana Ravish + Jarvis
 * PURPOSE  : AMAS Universal Gateway
 ******************************************************************/

const express = require("express");

const {
    startWhatsApp,
    sendGroupMessage,
    sendToMobile,
    sendToAmasGroup
} = require("./whatsapp");

const app = express();
const PORT = 3001;


/******************************************************************
 * JSON Body Parser
 ******************************************************************/

app.use(express.json());


/******************************************************************
 * HOME
 ******************************************************************/

app.get("/", (req, res) =>
{
    res.send("AMAS Universal Gateway Running...");
});


/******************************************************************
 * SEND WHATSAPP
 ******************************************************************/

app.post("/send", async (req, res) =>
{
    try
    {
        const payload = req.body || {};

        console.log("\n======================================");
        console.log("NEW REQUEST RECEIVED");
        console.log("======================================");
        console.log(JSON.stringify(payload, null, 2));
        console.log("======================================\n");

        const groupId = payload.groupId || "";
        const mobile = payload.mobile || "";
        const message = payload.data?.message;
        const replyToMessageId =
            payload.replyToMessageId ||
            payload.data?.replyToMessageId ||
            "";

        if (!message)
        {
            return res.status(400).json({
                success: false,
                code: "MESSAGE_MISSING",
                error: "Message Missing"
            });
        }

        //--------------------------------------------------
        // GROUP
        //--------------------------------------------------

        if (groupId !== "")
        {
            const sentMessage = await sendGroupMessage(
                groupId,
                message,
                replyToMessageId
            );

            return res.json({
                success: true,
                mode: "GROUP",
                destination: groupId,
                messageId: sentMessage?.key?.id || "-",
                message: "WhatsApp Group Message Sent"
            });
        }

        //--------------------------------------------------
        // INDIVIDUAL
        //--------------------------------------------------

        if (mobile !== "")
        {
            const sentMessage = await sendToMobile(
                mobile,
                message,
                replyToMessageId
            );

            return res.json({
                success: true,
                mode: "INDIVIDUAL",
                destination: mobile,
                messageId: sentMessage?.key?.id || "-",
                message: "WhatsApp Message Sent"
            });
        }


        //--------------------------------------------------
        // DEFAULT AMAS GROUP
        //--------------------------------------------------

        const sentMessage = await sendToAmasGroup(
            message,
            replyToMessageId
        );

        return res.json({
            success: true,
            mode: "AMAS_GROUP",
            messageId: sentMessage?.key?.id || "-",
            message: "AMAS Group Message Sent"
        });
    }
    catch (err)
    {
        console.error("\n❌ SEND ERROR :", err);

        return res.status(500).json({
            success: false,
            code: "SEND_FAILED",
            error: err.message
        });
    }
});


/******************************************************************
 * START SERVER
 ******************************************************************/

app.listen(PORT, async () =>
{
    console.log("🚀 AMAS Universal Gateway Started");
    console.log(`🌐 http://localhost:${PORT}\n`);

    try
    {
        await startWhatsApp();
    }
    catch (err)
    {
        console.error(
            "❌ WhatsApp Start Failed :",
            err.message
        );
    }
});