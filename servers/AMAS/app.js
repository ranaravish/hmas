const express = require("express");
const { startWhatsApp, sendGroupMessage } = require("./whatsapp");

const app = express();

const PORT = 3000;

// JSON Body Parser
app.use(express.json());

// Home Page
app.get("/", (req, res) => {

    res.send("AMAS WhatsApp Server Running...");

});

// Receive Payload from Apps Script
app.post("/send",async (req, res) => {

    console.log("\n==============================");
    console.log("NEW PAYLOAD RECEIVED");
    
    await sendGroupMessage(
    req.body.groupId,
    req.body.message
);
    console.log("==============================");

    console.log(JSON.stringify(req.body, null, 2));

    console.log("==============================\n");

    res.json({

        success: true,

        message: "Payload Received"

    });

});

startWhatsApp();
app.listen(PORT, () => {

    console.log(`🚀 Server Started : http://localhost:${PORT}`);

});
