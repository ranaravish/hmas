/******************************************************************
 * HMAS - Hyper Messaging Automation System
 * ---------------------------------------------------------------
 * FILE        : response.js
 * MODULE      : Standard Response Utility
 * VERSION     : 2.0.0
 * AUTHOR      : Rana Ravish + Jarvis
 * CREATED     : 05-Aug-2026
 * MODIFIED    : 05-Aug-2026
 * ---------------------------------------------------------------
 * DESCRIPTION :
 * Creates standardized success and error responses
 * for all HMAS modules.
 ******************************************************************/

//-------------------------------------------------------
// Return Success Response
//-------------------------------------------------------

function success(
    message,
    server = "",
    service = "",
    data = {}
)
{

    return {

        success: true,

        code: "SUCCESS",

        message: message,

        server: server,

        service: service,

        quota: {

            used: 0,

            remaining: 0,

            limit: 0

        },

        rateLimit: {

            remaining: 0,

            windowSeconds: 0

        },

        requestId: "",

        timestamp: new Date().toISOString(),

        data: data

    };

}


//-------------------------------------------------------
// Return Error Response
//-------------------------------------------------------

function error(
    code,
    message,
    server = "",
    service = ""
)
{

    return {

        success: false,

        code: code,

        message: message,

        server: server,

        service: service,

        quota: {

            used: 0,

            remaining: 0,

            limit: 0

        },

        rateLimit: {

            remaining: 0,

            windowSeconds: 0

        },

        requestId: "",

        timestamp: new Date().toISOString()

    };

}


//-------------------------------------------------------
// Export Module
//-------------------------------------------------------

module.exports = {

    success,

    error

};


/******************************************************************
 * End of File
 ******************************************************************/