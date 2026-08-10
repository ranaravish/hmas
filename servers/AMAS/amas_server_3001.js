/******************************************************************
 * PROJECT  : AMAS
 * FILE     : server.js
 * VERSION  : 1.1
 * AUTHOR   : Rana Ravish + Jarvis
 * PURPOSE  : Universal WhatsApp Gateway
 ******************************************************************/


const express = require("express");

//const whatsapp = require("./whatsapp");
//const whatsappRouter = require("./routes/whatsapp");

const {
    startWhatsApp,
    sendGroupMessage,
    sendToMobile
} = require("./whatsapp");



const app = express();

const PORT = 3001;

app.use(express.json());

//app.use("/send", whatsappRouter);

/******************************************************************
 * HOME
 ******************************************************************/
app.get("/", (req, res) => {

    res.send("AMAS Universal Gateway Running...");

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

        const groupId = payload.groupId || "";
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
        if (groupId !== "") {

            await sendGroupMessage(

                groupId,

                message

            );

            return res.json({

                success: true,

                mode: "GROUP",

                destination: groupId,

                message: "WhatsApp Group Message Sent"

            });

        }

        /******************************************************
         * SEND TO MOBILE
         ******************************************************/
        if (mobile !== "") {

            await sendToMobile(

                mobile,

                message

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

    console.log(`🚀 AMAS Universal Gateway Started`);
    console.log(`🌐 http://localhost:${PORT}\n`);

  await startWhatsApp();

});