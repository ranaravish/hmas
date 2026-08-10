
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());
//-------------------------------------------------------
// AMAS Server
app.post("/send/amas", async (req, res) => {

    try {
	console.log(JSON.stringify(req.body, null, 2));	
        const response = await axios.post(
            "http://localhost:3001/send",
            req.body
        );

        res.json(response.data);

    } catch (error) {

        console.log("\n========== FORWARDING ERROR ==========");
        console.log("Message:", error.message);

        if (error.code) {
            console.log("Code:", error.code);
        }

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }

        console.log("======================================\n");

        res.status(500).json({
            success: false,
            message: "Unable to connect to AMAS Server"
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




console.log("Route /send/amas registered");

const PORT = 3000;

app.listen(PORT, () => {
    console.log("Gateway Server Started on Port " + PORT);
});