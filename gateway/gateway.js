
const express = require("express");
const axios = require("axios");


const apiKey = require("./middleware/apiKey");
const configLoader = require("./utils/configLoader");
const app = express();

app.use(express.json());
//-------------------------------------------------------
// Dynamic HMAS Route
//-------------------------------------------------------

app.post("/send/:serverId", async (req, res) => {

    //-------------------------------------------------------
    // Read Server ID
    //-------------------------------------------------------

    const serverId = req.params.serverId;


   

    try {

        //-------------------------------------------------------
        // Load Server Configuration
        //-------------------------------------------------------

        const serverConfig = configLoader.getServer(serverId);

        //-------------------------------------------------------
        // Load Default Service Policy
        //-------------------------------------------------------

        const servicePolicy = configLoader.getPolicy("send");

        //-------------------------------------------------------
        // Apply Server Override
        //-------------------------------------------------------

        if (
        serverConfig.override &&
        serverConfig.override.send
        )
        {

     Object.assign(

        servicePolicy,

        serverConfig.override.send

    );

}

        console.log("\n========== SERVICE POLICY ==========");
        console.log(servicePolicy);
        console.log("====================================\n");

        //-------------------------------------------------------
        // Check Send Service Status
        //-------------------------------------------------------

        if (!servicePolicy.enabled)
        {

    return res.status(403).json({

        success: false,

        message: "Send service is disabled."

    });

}

        if (!serverConfig) {

        return res.status(404).json({

        success: false,

        message: "Server configuration not found."

        });

}
        console.log("\n========== SERVER CONFIG ==========");
        console.log(serverConfig);

        //-------------------------------------------------------
        // Validate API Key
        //-------------------------------------------------------

        const apiResult = apiKey.validate(

        serverConfig,

        req.headers["x-api-key"]

        );

        if (!apiResult.success)
        {

            return res.status(401).json(apiResult);

        }   
        console.log("===================================\n");

       
       
        //-------------------------------------------------------
        // Incoming Payload
        //-------------------------------------------------------

        console.log(JSON.stringify(req.body, null, 2));

        //-------------------------------------------------------
        // Temporary Hardcoded Forwarding
        // (Will be replaced with serverConfig.url in Step-5.5)
        //-------------------------------------------------------

        const response = await axios.post(

             serverConfig.url,

            req.body

        );

        res.json(response.data);

    } catch (error) {

        console.log("\n========== FORWARDING ERROR ==========");
        console.log("Message :", error.message);

        if (error.code) {
            console.log("Code :", error.code);
        }

        if (error.response) {
            console.log("Status :", error.response.status);
            console.log("Data :", error.response.data);
        }

        console.log("======================================\n");

        res.status(500).json({

            success: false,

            message: "Unable to connect to Target Server"

        });

    }

});

//-----------------------
// School server
app.post("/send/school", async (req, res) => {

    try {

        const response = await axios.post(
            "http://localhost:3002/send",
            req.body
        );

        res.json(response.data);

    } catch (error) {

        console.error(error.message);

        res.status(500).json({
            success: false,
            message: "Unable to connect to School Server"
        });

    }

});




console.log("Route /send/:serverId registered");

const PORT = 3000;

app.listen(PORT, () => {
    console.log("Gateway Server Started on Port " + PORT);
});