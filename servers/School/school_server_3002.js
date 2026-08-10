/******************************************************************
 * PROJECT  : AMAS
 * FILE     : server.js
 * VERSION  : 1.1
 * AUTHOR   : Rana Ravish + Jarvis
 * PURPOSE  : School_ WhatsApp Gateway
 ******************************************************************/

const express = require("express");

const {
    startWhatsApp,
    sendGroupMessage,
    sendToMobile
} = require("./whatsapp");

const app = express();

const PORT = 3002;

app.use(express.json());

/******************************************************************
 * HOME
 ******************************************************************/
app.get("/", (req, res) => {

    res.send("school_Server Running...");

});

/******************************************************************
 * SEND WHATSAPP
 ******************************************************************/
app.post("/send", async (req, res) => {

    try {

        const payload = req.body; 
   

        console.log("\n======================================");
        console.log("NEW REQUEST RECEIVED");
        console.log("======================================");
        console.log(JSON.stringify(payload, null, 2));
        console.log("======================================\n");

        const group = payload.group || "";
        const mobile = payload.mobile || "";
        const message = payload.data?.message;

        if (!message) {

            return res.status(400).json({

                success: false,

                error: "Message Missing"

            });

        }

        /******************************************************
         * SEND TO GROUP
         ******************************************************/
        if (group !== "") {

            await sendGroupMessage(

                group,

                message

            );

            return res.json({

                success: true,

                mode: "GROUP",

                destination: group,

                message: "WhatsApp Group Message Sent"

            });

        }

        /******************************************************
         * SEND TO MOBILE
         ******************************************************/
        if (mobile !== "") {

            await sendToMobile(

                mobile,

                message,

                payload.data?.attachment || null

);

            return res.json({

                success: true,

                mode: "INDIVIDUAL",

                destination: mobile,

                message: "WhatsApp Sent"

            });

        }

        /******************************************************
         * INVALID REQUEST
         ******************************************************/
        return res.status(400).json({

            success: false,

            error: "Either 'mobile' or 'groupId' is required."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});

/******************************************************************
 * START SERVER
 ******************************************************************/
app.listen(PORT, async () => {

    console.log(`🚀 HMIT Whatsapp Gateway Started`);
    console.log(`🌐 http://localhost:${PORT}\n`);

    await startWhatsApp();

});