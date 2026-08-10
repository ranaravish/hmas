/******************************************************************
 * HMAS - Hyper Messaging Automation System
 * ---------------------------------------------------------------
 * FILE        : apiKey.js
 * MODULE      : API Key Validation Middleware
 * VERSION     : 2.0.0
 * AUTHOR      : Rana Ravish + Jarvis
 * CREATED     : 05-Aug-2026
 * MODIFIED    : 05-Aug-2026
 * ---------------------------------------------------------------
 * DESCRIPTION :
 * Validates incoming API Key against the
 * configured server API Key.
 ******************************************************************/

const response = require("../utils/response");


//-------------------------------------------------------
// Validate API Key
//-------------------------------------------------------

function validate(serverConfig, requestApiKey)
{

    if (!requestApiKey)
    {

        return response.error(

            "API_KEY_MISSING",

            "API Key is missing."

        );

    }


    if (requestApiKey !== serverConfig.apiKey)
    {

        return response.error(

            "INVALID_API_KEY",

            "Invalid API Key."

        );

    }


    return response.success(

        "API Key Validated"

    );

}


//-------------------------------------------------------
// Export Module
//-------------------------------------------------------

module.exports = {

    validate

};


/******************************************************************
 * End of File
 ******************************************************************/