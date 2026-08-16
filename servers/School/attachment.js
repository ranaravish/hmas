/******************************************************************
 * HMAS - Hyper Messaging Automation System
 * ---------------------------------------------------------------
 * FILE        : attachment.js
 * MODULE      : Attachment Engine
 * VERSION     : 1.0.0
 * AUTHOR      : Rana Ravish + Jarvis
 * CREATED     : 06-Aug-2026
 * ---------------------------------------------------------------
 * DESCRIPTION :
 * Processes attachments for all HMAS servers.
 *
 * Supported Sources
 * -----------------
 * - Local File
 * - HTTP
 * - HTTPS
 *
 * Returns a Standard Attachment Object.
 ******************************************************************/

const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const axios = require("axios");

//-------------------------------------------------------
// Process Attachment
//-------------------------------------------------------

async function processAttachment(attachment)
{
    //-------------------------------------------------------
    // Validate
    //-------------------------------------------------------

    if (!attachment || !attachment.url)
    {
        throw new Error("Attachment URL is required.");
    }

    //-------------------------------------------------------
    // Detect Source Type
    //-------------------------------------------------------

    const source = attachment.url.trim();

    const isHttp =
        source.startsWith("http://") ||
        source.startsWith("https://");

    //-------------------------------------------------------
    // Common Variables
    //-------------------------------------------------------

    let buffer;
    let filename;
    let mimeType;

    //-------------------------------------------------------
    // HTTP / HTTPS
    //-------------------------------------------------------

    if (isHttp)
    {
        console.log("HTTP Source");
        console.log(source);

        const response = await axios.get(source, {

            responseType: "arraybuffer"

        });

        //---------------------------------------------------
        // Buffer
        //---------------------------------------------------

        buffer = Buffer.from(response.data);

        //---------------------------------------------------
        // Filename
        //---------------------------------------------------

        const disposition =
            response.headers["content-disposition"];

        if (disposition)
        {
            const match =
                disposition.match(/filename="?([^"]+)"?/i);

            if (match)
            {
                filename = match[1];
            }
        }

        //---------------------------------------------------
        // Fallback Filename
        //---------------------------------------------------

        if (!filename)
        {
            filename = path.basename(
                new URL(source).pathname
            );
        }

        //---------------------------------------------------
        // MIME Type
        //---------------------------------------------------

        mimeType = response.headers["content-type"];

        // Remove HTTP parameters like "; charset=utf-8"
        // or "; qs=0.001"

        if (mimeType)
        {
        mimeType = mimeType.split(";")[0].trim();
        }

        // Fallback

    if (!mimeType)
    {
    mimeType = mime.lookup(filename);
    }   
    }

    //-------------------------------------------------------
    // Local File
    //-------------------------------------------------------

    else
    {
        console.log("Local File");
        console.log(source);

        if (!fs.existsSync(source))
        {
            throw new Error(
                "Attachment file not found."
            );
        }

        buffer = fs.readFileSync(source);

        filename = path.basename(source);

        mimeType = mime.lookup(filename);
    }

    //-------------------------------------------------------
    // Default MIME
    //-------------------------------------------------------

    if (!mimeType)
    {
        mimeType = "application/octet-stream";
    }

    //-------------------------------------------------------
    // Debug
    //-------------------------------------------------------

    console.log("Attachment Size :", buffer.length);
    console.log("Filename :", filename);
    console.log("Mime Type :", mimeType);

    //-------------------------------------------------------
    // Return
    //-------------------------------------------------------

    return {

        success: true,

        filename,

        mimeType,

        size: buffer.length,

        buffer

    };
}

//-------------------------------------------------------
// Export Module
//-------------------------------------------------------

module.exports = {

    processAttachment

};

/******************************************************************
 * End of File
 ******************************************************************/