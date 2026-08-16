/******************************************************************
 * HMAS - Parser Service
 * SERVER : School
 * VERSION: 1.1.0
 ******************************************************************/

const axios = require("axios");
const crypto = require("crypto");

//-------------------------------------------------------
// Service Switch
//-------------------------------------------------------

const PARSER_ENABLED = true;

//-------------------------------------------------------
// Parser Keywords
//-------------------------------------------------------

const PARSER_KEYWORDS = [
    "due",
    "atten",
    "absent",
    "profile",
    "history",
    "marks"
];

//-------------------------------------------------------
// PHP API
//-------------------------------------------------------

const PUSH_URL =
    "https://vvsjharkhand.org/api1.php";

//-------------------------------------------------------
// API Secret
//-------------------------------------------------------
//
// Same apiKey already used for School server.
// This will be used as HMAC secret for outgoing
// HMAS -> PHP communication.
//
//-------------------------------------------------------

const SECRET_KEY =
    "SCHOOL_5H8K2P9L7X4M1Q";


//-------------------------------------------------------
// Parser Service
//-------------------------------------------------------

async function parseMessage(payload)
{
    //---------------------------------------------------
    // Service Enabled ?
    //---------------------------------------------------

    if (!PARSER_ENABLED)
    {
        return {
            success: false,
            code: "SERVICE_DISABLED",
            error: "Parser service is disabled."
        };
    }

    //---------------------------------------------------
    // Parser Input
    //---------------------------------------------------

    const sender =
        String(payload?.sender || "").trim();

    const rawKey =
        String(payload?.key || "").trim();

    //---------------------------------------------------
    // Parsed Values
    //---------------------------------------------------

    let parsedKey = "";
    let regNo = "";

    //---------------------------------------------------
    // HELP Command
    //---------------------------------------------------

    if (/^help$/i.test(rawKey))
    {
        parsedKey = "help";
        regNo = 0;
    }

    //---------------------------------------------------
    // Normal Keyword + Registration Number
    //---------------------------------------------------

    else
    {
        const match =
            rawKey.match(/^([a-z]+)\s+(\d+)$/i);

        //---------------------------------------------------
        // Pattern Check
        //---------------------------------------------------

        if (!match)
        {
            return {
                success: false,
                code: "PATTERN_NOT_MATCHED"
            };
        }

        //---------------------------------------------------
        // Extract
        //---------------------------------------------------

        parsedKey =
            match[1].toLowerCase();

        regNo =
            match[2];

        //---------------------------------------------------
        // Keyword Validation
        //---------------------------------------------------

        if (!PARSER_KEYWORDS.includes(parsedKey))
        {
            return {
                success: false,
                code: "KEYWORD_NOT_ALLOWED",
                key: parsedKey
            };
        }
    }

    //---------------------------------------------------
    // Prepare PHP Payload
    //---------------------------------------------------

    const pushPayload = {
        key: parsedKey,
        regno: String(regNo),
        phone: sender
    };

    //---------------------------------------------------
    // Secure Push
    //---------------------------------------------------

    const pushResult =
        await pushToPHP(pushPayload);

    //---------------------------------------------------
    // Push Failed
    //---------------------------------------------------

    if (!pushResult.success)
    {
        return {
            success: false,
            code: "PUSH_FAILED",
            key: parsedKey,
            Reg: regNo,
            Sender: sender,
            push: pushResult
        };
    }

    //---------------------------------------------------
    // Final Success
    //---------------------------------------------------

    return {
        success: true,
        code: "PARSED",
        key: parsedKey,
        Reg: regNo,
        Sender: sender,
        push: pushResult
    };
}


//-------------------------------------------------------
// Secure Push To PHP
//-------------------------------------------------------

async function pushToPHP(data)
{
    try
    {
        //---------------------------------------------------
        // Timestamp
        //---------------------------------------------------

        const timestamp =
            Math.floor(Date.now() / 1000);

        //---------------------------------------------------
        // Unique Request ID
        //---------------------------------------------------

        const requestId =
            crypto.randomUUID();

        //---------------------------------------------------
        // Request Data
        //---------------------------------------------------

        const requestData = {
            key: data.key,
            regno: String(data.regno),
            phone: String(data.phone),
            timestamp: timestamp,
            request_id: requestId
        };

        //---------------------------------------------------
        // Canonical Payload
        //---------------------------------------------------

        const payload =
            requestData.key + "|" +
            requestData.regno + "|" +
            requestData.phone + "|" +
            requestData.timestamp + "|" +
            requestData.request_id;

        //---------------------------------------------------
        // Generate HMAC-SHA256
        //---------------------------------------------------

        const signature =
            crypto
                .createHmac(
                    "sha256",
                    SECRET_KEY
                )
                .update(payload, "utf8")
                .digest("hex");

        //---------------------------------------------------
        // Add Signature
        //---------------------------------------------------

        requestData.signature =
            signature;

        //---------------------------------------------------
        // Send HTTPS POST
        //---------------------------------------------------

        const response =
            await axios.post(
                PUSH_URL,
                requestData,
                {
                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    timeout: 30000
                }
            );

        //---------------------------------------------------
        // PHP Response
        //---------------------------------------------------

        return {
            success: true,
            status: response.status,
            response: response.data
        };
    }
    catch (error)
    {
        //---------------------------------------------------
        // Push Failed
        //---------------------------------------------------

        return {
            success: false,
            code: "PUSH_FAILED",

            error:
                error.response?.data ||
                error.message,

            status:
                error.response?.status || "-"
        };
    }
}

//-------------------------------------------------------
// Export
//-------------------------------------------------------

module.exports = {
    parseMessage,
    pushToPHP
};